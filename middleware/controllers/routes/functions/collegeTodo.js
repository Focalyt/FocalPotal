
const {
  CollegeTodo,
} = require('../../models');

module.exports.getList = async (req, res) => {
  try {
    const { _college } = req.user;
    const todos = await CollegeTodo.find(
      { _college, status: true },
    ).select('title description labels isImportant isStarred isDeleted isCompleted').sort({ createdAt: -1 });
    return res.send({ status: true, message: 'College Todo List get successfully!', data: { todos } });
  } catch (err) {
    return req.errFunc(err);
  }
};

module.exports.addTodo = async (req, res) => {
  try {
    const { _college } = req.user;
    const { isImp, isStr } = req.body;
    let isImportant, isStarred;
    if (isImp === '0') {
      isImportant = false;
    } else {
      isImportant = true;
    }
    if (isStr === '0') {
      isStarred = false;
    } else {
      isStarred = true;
    }
    const addT = await CollegeTodo.create({ ...req.body, isImportant, isStarred, _college });
    if (!addT) throw req.ykError('Todo task not add now. Please try again later!');
    return res.send({ status: true, message: 'Todo task data add successfully!', data: { addT } });
  } catch (err) {
    return req.errFunc(err);
  }
};

module.exports.updateTodo = async (req, res) => {
  try {
    const { isImp, isStr } = req.body;
    let isImportant, isStarred;
    if (isImp === '0') {
      isImportant = false;
    } else {
      isImportant = true;
    }
    if (isStr === '0') {
      isStarred = false;
    } else {
      isStarred = true;
    }
    const todo = await CollegeTodo.findByIdAndUpdate(req.body._id, { ...req.body, isImportant, isStarred }, { new: true });
    if (!todo) throw req.ykError('Todo task not update now. Please try again later!');
    return res.send({ status: true, message: 'Todo task data update successfully!', data: { todo } });
  } catch (err) {
    return req.errFunc(err);
  }
};

module.exports.todoData = async (req, res) => {
  try {
    const { id } = req.params;
    const todoData = await CollegeTodo.findById(id).select('title description labels isImportant isStarred');
    if (!todoData) throw req.ykError('Todo task data not get now. Please try again later!');
    let isImp = '0';
    let isStr = '0';
    if (todoData.isImportant) isImp = '1';
    if (todoData.isStarred) isStr = '1';
    const todo = {
      _id: todoData._id, title: todoData.title, description: todoData.description, labels: todoData.labels, isImp, isStr,
    };
    return res.send({ status: true, message: 'College Todo data get successfully!', data: { todo } });
  } catch (err) {
    return req.errFunc(err);
  }
};
