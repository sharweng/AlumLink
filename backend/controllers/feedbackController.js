import Feedback from '../models/Feedback.js';

export const createFeedback = async (req, res) => {
  try {
    const { message, page, imageBase64 } = req.body;
    const user = req.user?.id || null;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ message: 'Message is required' });
    }

    const fb = new Feedback({ user, message, page, imageBase64 });
    await fb.save();
    return res.status(201).json({ message: 'Feedback submitted' });
  } catch (err) {
    console.error('Error creating feedback', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const listFeedback = async (req, res) => {
  try {
    const items = await Feedback.find().populate('user', 'name username profilePicture').sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    console.error('Error listing feedback', err);
    res.status(500).json({ message: 'Server error' });
  }
};
