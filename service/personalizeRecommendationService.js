const personalizeRuntime = require('../config/personalizeRuntimeConfig');
const PERSONALIZE_CAMPAIGN_ARN = process.env.PERSONALIZE_CAMPAIGN_ARN;

class PersonalizeService {

    static async getRecommendations(userId, numResults = 5) {
        try {
            const params = {
                campaignArn: PERSONALIZE_CAMPAIGN_ARN,
                userId,
                numResults
            };
            const response = await personalizeRuntime.getRecommendations(params).promise();
            return response.itemList || [];
        } catch (error) {
            console.error(`Failed to fetch recommendations: ${error}`);
            return [];
        }
    }
}

module.exports = PersonalizeService;
