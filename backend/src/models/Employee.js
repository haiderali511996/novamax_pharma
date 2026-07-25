const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    employeeId: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    designation: { type: String, trim: true },
    designationLevel: {
      type: String,
      enum: [
        'ceo',
        'director',
        'regional_sales_manager',
        'area_sales_manager',
        'medical_representative',
        'pharmacist',
        'warehouse_staff',
        'accountant',
        'hr_executive',
        'office_boy',
        'staff',
        'other',
      ],
      default: 'staff',
    },
    department: { type: String, trim: true },
    reportsTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', default: null },
    territory: { type: mongoose.Schema.Types.ObjectId, ref: 'Territory' },
    joinDate: { type: Date, default: Date.now },
    salary: { type: Number, min: 0, default: 0 },
    status: { type: String, enum: ['active', 'on_leave', 'terminated'], default: 'active' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Employee', employeeSchema);
