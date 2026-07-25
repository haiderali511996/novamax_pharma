const asyncHandler = require('express-async-handler');
const { logAudit } = require('./auditLogger');

// Generic CRUD controller factory for simple REST resources. Every
// create/update/delete automatically writes an AuditLog entry - this is
// the one place nearly all resources' mutations pass through, so hooking
// it here covers the whole app without instrumenting each route by hand.
function createCrudController(Model, options = {}) {
  const { populate, searchFields = [] } = options;

  const getAll = asyncHandler(async (req, res) => {
    const { page = 1, limit = 50, search, ...filters } = req.query;
    const query = { ...filters };

    if (search && searchFields.length) {
      query.$or = searchFields.map((field) => ({
        [field]: { $regex: search, $options: 'i' },
      }));
    }

    let cursor = Model.find(query)
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    if (populate) cursor = cursor.populate(populate);

    const [items, total] = await Promise.all([cursor, Model.countDocuments(query)]);

    res.json({ success: true, count: items.length, total, page: Number(page), data: items });
  });

  const getOne = asyncHandler(async (req, res) => {
    let cursor = Model.findById(req.params.id);
    if (populate) cursor = cursor.populate(populate);
    const item = await cursor;
    if (!item) {
      res.status(404);
      throw new Error('Resource not found');
    }
    res.json({ success: true, data: item });
  });

  const createOne = asyncHandler(async (req, res) => {
    if (req.user) req.body.createdBy = req.user._id;
    const item = await Model.create(req.body);
    await logAudit({ user: req.user, action: 'create', resource: Model.modelName, resourceId: item._id, after: item });
    res.status(201).json({ success: true, data: item });
  });

  const updateOne = asyncHandler(async (req, res) => {
    const before = await Model.findById(req.params.id).lean();
    const item = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!item) {
      res.status(404);
      throw new Error('Resource not found');
    }
    await logAudit({
      user: req.user,
      action: 'update',
      resource: Model.modelName,
      resourceId: item._id,
      before,
      after: item,
    });
    res.json({ success: true, data: item });
  });

  const deleteOne = asyncHandler(async (req, res) => {
    const item = await Model.findByIdAndDelete(req.params.id);
    if (!item) {
      res.status(404);
      throw new Error('Resource not found');
    }
    await logAudit({ user: req.user, action: 'delete', resource: Model.modelName, resourceId: item._id, before: item });
    res.json({ success: true, data: {} });
  });

  return { getAll, getOne, createOne, updateOne, deleteOne };
}

function crudRouter(express, Model, options = {}) {
  const router = express.Router();
  const ctrl = createCrudController(Model, options);
  router
    .route('/')
    .get(ctrl.getAll)
    .post(ctrl.createOne);
  router
    .route('/:id')
    .get(ctrl.getOne)
    .put(ctrl.updateOne)
    .delete(ctrl.deleteOne);
  return router;
}

module.exports = { createCrudController, crudRouter };
