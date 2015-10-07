var _ = require('lodash');
var fs = require('fs');

var trainingData = JSON.parse(fs.readFileSync('train.json', 'utf8'));

crossValidate(trainingData, 10);

function crossValidate(trainingData, folds, modelFactory) {
    
    var foldSize = trainingData.length / folds;
    
    var correctCount = 0;
    var totalCount = 0;
    
    for (var fold = 0; fold < folds - 1; ++fold) {
        
        console.log('Analysing fold: ' + fold);
        
        var foldStart = fold * foldSize;
        var foldEnd = fold === folds - 1 ? trainingData.length : (fold + 1) * foldSize;
        
        console.log('  Preparing test data');
        var foldTestData = _.slice(trainingData, foldStart, foldEnd);
        
        console.log('  Preparing training data');
        var foldTrainingData = _.filter(trainingData, function(x) {
            return _.findIndex(foldTestData, function(y) { return x.id === y.id}) === -1;
        });
        
        var model = modelFactory(foldTrainingData);
        
        console.log('  Predicting');
        var foldTestDataCount = 0;
        _.each(foldTestData, function(d) {
            if (foldTestDataCount % 100 === 0) {
                process.stdout.write('.');
            }
            ++foldTestDataCount;
            
            var guess = model(d);
            
            ++totalCount;
            if (guess === d.cuisine) {
                ++correctCount;
            }
        })
    }
    
    console.log('Correct count: ' + correctCount);
    console.log('Total count: ' + totalCount);
}

// Gives a score of 0.63755
function naiveJaccardModelFactory(object) {
    return function(object) {
        return nearestNeighbour(object, trainingData, jaccardDistance).cuisine;
    }
}

function nearestNeighbour(object, trainingData, distanceFn) {
    return _.max(trainingData, function(y) {
        return distanceFn(object, y);
    });
}

function jaccardDistance(a, b) {
    var intersectionLength = _.intersection(a.ingredients, b.ingredients).length;
    return intersectionLength / (a.ingredients.length + b.ingredients.length - intersectionLength);
}