const Project = require('../models/Project');
const Category = require('../models/Category');
const User = require('../models/User');

// @desc    Get dashboard statistics
const getDashboardStats = async (req, res) => {
    try {
        // Get counts for different entities
        const [
            totalProjects,
            totalCategories,
            totalUsers
        ] = await Promise.all([
            Project.countDocuments(),
            Category.countDocuments(),
            User.countDocuments()
        ]);

        // Get recent activity (last 7 days)
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

        const [
            recentProjects,
        ] = await Promise.all([
            Project.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
        ]);

        // Get category distribution
        const categoryDistribution = await Project.aggregate([
            { $unwind: "$categories" },
            {
                $lookup: {
                    from: "categories",
                    localField: "categories",
                    foreignField: "_id",
                    as: "categoryInfo"
                }
            },
            {
                $group: {
                    _id: "$categoryInfo.name",
                    count: { $sum: 1 },
                    name: { $first: { $arrayElemAt: ["$categoryInfo.name", 0] } }
                }
            },
            {
                $project: {
                    name: 1,
                    count: 1,
                    _id: 0
                }
            }
        ]);

        // Format the response
        const stats = {
            cards: [
                { title: "Total Projects", value: totalProjects },
                { title: "Total Categories", value: totalCategories },
                { title: "Total Users", value: totalUsers },
            ],
            dataDistribution: [
                { name: "Projects", value: totalProjects },
                { name: "Categories", value: totalCategories }
            ],
            recentActivity: {
                projects: recentProjects,
            },
            categoryDistribution: categoryDistribution
        };

        res.status(200).json({
            status: true,
            message: "Dashboard statistics fetched successfully",
            data: stats
        });
    } catch (error) {
        console.error('Get Dashboard Stats Error:', error);
        res.status(500).json({ status: false, message: error.message });
    }
};

module.exports = { getDashboardStats };