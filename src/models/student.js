const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema({
  student_name: {
    type: String,
    required: true,
  },
  roll_number: {
    type: String,
    required: true,
    uppercase: true,
    unique: true,
  },
  father_name: {
    type: String,
    required: true,
  },
  mother_name: {
    type: String,
    required: true,
  },
  health_status: {
    type: String,
  },
  class_behaviour: {
    type: String,
  },
  interest: {
    type: String,
  },
  remarks: {
    type: String,
  },
  total_present: {
    type: String,
  },
  sub_name: {
    type: [String],
    required: true,
  },
  result_status: {
    type: String,
    uppercase: true,
    required: true,
  },
  max_marks: [Number],
  marks_obtained: [Number],
});

const Student = mongoose.model("Student", studentSchema);

module.exports = Student;
