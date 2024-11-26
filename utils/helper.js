const calculateElo = (ratingA, ratingB, result) => {
  const K = 32;
  const expectedScoreA = 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
  const expectedScoreB = 1 - expectedScoreA;

  const newRatingA = Math.round(ratingA + K * (result - expectedScoreA));
  const newRatingB = Math.round(ratingB + K * (1 - result - expectedScoreB));

  return { newRatingA, newRatingB };
};

module.exports = {
  calculateElo,
};
