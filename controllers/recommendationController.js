const Rankings = require('../models/rankingsModel');
const PersonalizeService = require('../service/personalizeRecommendationService');

const calculateAndSaveRecommendations = (userId, categoryId, latestRankingId, numResults = 3) => {

    if (!userId || !categoryId || !latestRankingId) {
        console.error("Missing required parameters: userId, categoryId, latestRankingId");
        return Promise.resolve();
    }

    (async () => {
        try {
            const recommendations = await PersonalizeService.getRecommendations(userId, numResults);
            const itemList = recommendations.map(item => item.itemId);

            if (itemList.length > 0) {
                const writeResponse = await Rankings.updateRecommendation(userId, categoryId, itemList, latestRankingId);
                if (writeResponse) {
                    console.log("Recommendations fetched and saved successfully.");
                } else {
                    console.error("Failed to write recommendations to DynamoDB");
                }
            } else {
                console.error("No recommendations found");
            }
        } catch (error) {
            console.error(`Error in background process: ${error.message}`);
        }
    })();
    return Promise.resolve();
};

module.exports = calculateAndSaveRecommendations;
