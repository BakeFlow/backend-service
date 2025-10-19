const moment = require("moment");
const user_roles = require("../../../core/enums/user.roles.enum");
const User = require("../../../models/user.model");

//get sellers and buyers counts
const getSellersAndBuyersCounts = async (req, res) => {
  try {
    const sellersCount = await User.countDocuments({ role: user_roles.SELLER });
    const buyersCount = await User.countDocuments({ role: user_roles.BUYER });

    res.status(200).json({
      success: true,
      data: {
        sellersCount,
        buyersCount,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message || "Server error" });
  }
};

//get account creation history daily , monthly and yearly
const getAccountCreationHistory = async (req, res) => {
  try {
    const { type } = req.query;

    if (!type || !["daily", "monthly", "yearly"].includes(type)) {
      return res.status(400).json({ success: false, message: "Invalid type parameter" });
    }

    let startDate, format, groupBy;
   

    if (type === "daily") {
      startDate = moment().subtract(6, "days").startOf("day").toDate(); // 7 days including today
      format = "%Y-%m-%d";
      groupBy = {
        $dateToString: { format, date: "$createdAt" },
      };
    } else if (type === "monthly") {
      startDate = moment().subtract(11, "months").startOf("month").toDate(); // Last 12 months
      format = "%Y-%m";
      groupBy = {
        $dateToString: { format, date: "$createdAt" },
      };
    } else if (type === "yearly") {
      startDate = moment().subtract(6, "years").startOf("year").toDate(); // Last 7 years
      format = "%Y";
      groupBy = {
        $dateToString: { format, date: "$createdAt" },
      };
    }

    const aggregationPipeline = [
      {
        $match: {
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: groupBy,
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ];

    const history = await User.aggregate(aggregationPipeline);

    // Generate full range and fill missing with 0
    let filledResult = [];
    if (type === "daily") {
      for (let i = 0; i < 7; i++) {
        const date = moment().subtract(6 - i, "days");
        const formatted = date.format("YYYY-MM-DD");
        const dayName = date.format("dddd");
        const record = history.find((h) => h._id === formatted);
        filledResult.push({ label: dayName, count: record ? record.count : 0 });
      }
    } else if (type === "monthly") {
      for (let i = 0; i < 12; i++) {
        const date = moment().subtract(11 - i, "months");
        const formatted = date.format("YYYY-MM");
        const monthName = date.format("MMMM");
        const record = history.find((h) => h._id === formatted);
        filledResult.push({ label: monthName, count: record ? record.count : 0 });
      }
    } else if (type === "yearly") {
      for (let i = 0; i < 7; i++) {
        const year = moment()
          .subtract(6 - i, "years")
          .format("YYYY");
        const record = history.find((h) => h._id === year);
        filledResult.push({ label: year, count: record ? record.count : 0 });
      }
    }

    res.status(200).json({
      success: true,
      data: filledResult,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message || "Server error" });
  }
};

module.exports = {
  getSellersAndBuyersCounts,
  getAccountCreationHistory,
};
