const stepsService = require('../services/stepsService');

exports.getSteps = async (req, res) => {
  try {
    const steps = await stepsService.getSteps(req.user._id);
    res.json({ stepsTaken: steps });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateSteps = async (req, res) => {
  try {
    const { stepsTaken } = req.body;
    const steps = await stepsService.updateSteps(req.user._id, stepsTaken);
    res.json({ stepsTaken: steps });
  } catch (error) {
    console.error("Error:", error);
    res.status(400).json({ message: error.message });
  }
};