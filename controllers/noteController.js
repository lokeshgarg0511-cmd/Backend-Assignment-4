const mongoose = require('mongoose');
const Note = require('../models/Note');
const appEventEmitter = require('../events/eventEmitter');

/**
 * @desc    Create a new note
 * @route   POST /api/notes
 * @access  Private (Logged-in User)
 */
const createNote = async (req, res) => {
  try {
    const { title, content } = req.body;

    if (!title || !title.trim() || !content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed: title and content are required fields.'
      });
    }

    const note = await Note.create({
      title: title.trim(),
      content: content.trim(),
      owner: req.user._id
    });

    // Trigger note creation domain event
    appEventEmitter.emit('note_created', note);

    return res.status(201).json({
      success: true,
      message: 'Note created successfully.',
      data: note
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error while creating note.',
      error: error.message
    });
  }
};

/**
 * @desc    Get all notes belonging to the logged-in user
 * @route   GET /api/notes
 * @access  Private (Logged-in User)
 */
const getNotes = async (req, res) => {
  try {
    const notes = await Note.find({ owner: req.user._id }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: notes.length,
      data: notes
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error while retrieving notes.',
      error: error.message
    });
  }
};

/**
 * @desc    Get a particular note by ID (Owner only)
 * @route   GET /api/notes/:id
 * @access  Private (Logged-in User)
 */
const getNoteById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Note ID format.'
      });
    }

    const note = await Note.findById(id);

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found.'
      });
    }

    // Verify ownership: users must only access their own notes
    if (note.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access forbidden: You do not have permission to access another user's note."
      });
    }

    return res.status(200).json({
      success: true,
      data: note
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error while retrieving note.',
      error: error.message
    });
  }
};

/**
 * @desc    Update a particular note by ID (Owner only)
 * @route   PUT /api/notes/:id
 * @access  Private (Logged-in User)
 */
const updateNote = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Note ID format.'
      });
    }

    const note = await Note.findById(id);

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found.'
      });
    }

    // Verify ownership: users can only update their own notes
    if (note.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access forbidden: You do not have permission to update another user's note."
      });
    }

    if ((!title || !title.trim()) && (!content || !content.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed: Please provide at least title or content to update.'
      });
    }

    if (title && title.trim()) note.title = title.trim();
    if (content && content.trim()) note.content = content.trim();

    const updatedNote = await note.save();

    return res.status(200).json({
      success: true,
      message: 'Note updated successfully.',
      data: updatedNote
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error while updating note.',
      error: error.message
    });
  }
};

/**
 * @desc    Delete a particular note by ID (Owner only)
 * @route   DELETE /api/notes/:id
 * @access  Private (Logged-in User)
 */
const deleteNote = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Note ID format.'
      });
    }

    const note = await Note.findById(id);

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found.'
      });
    }

    // Verify ownership: users can only delete their own notes
    if (note.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access forbidden: You do not have permission to delete another user's note."
      });
    }

    await note.deleteOne();

    // Trigger note deletion domain event
    appEventEmitter.emit('note_deleted', note);

    return res.status(200).json({
      success: true,
      message: 'Note deleted successfully.',
      data: {
        id: note._id,
        title: note.title
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error while deleting note.',
      error: error.message
    });
  }
};

module.exports = {
  createNote,
  getNotes,
  getNoteById,
  updateNote,
  deleteNote
};

