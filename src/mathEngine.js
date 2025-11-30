// Math question generation and validation
class MathEngine {
    constructor() {
        this.difficulty = 1; // 1 = easy, 2 = medium, 3 = hard
    }

    generateQuestion(difficulty = 1) {
        this.difficulty = difficulty;
        const operations = ['+', '-', '*'];
        const operation = operations[Math.floor(Math.random() * operations.length)];
        
        let a, b, correctAnswer;

        switch (operation) {
            case '+':
                a = this.getRandomNumber(difficulty);
                b = this.getRandomNumber(difficulty);
                correctAnswer = a + b;
                break;
            case '-':
                a = this.getRandomNumber(difficulty);
                b = this.getRandomNumber(difficulty);
                // Ensure non-negative result
                if (a < b) [a, b] = [b, a];
                correctAnswer = a - b;
                break;
            case '*':
                a = this.getRandomNumber(difficulty, true);
                b = this.getRandomNumber(difficulty, true);
                correctAnswer = a * b;
                break;
        }

        return {
            text: `${a} ${operation} ${b} = ?`,
            correctAnswer: correctAnswer,
            operation: operation
        };
    }

    getRandomNumber(difficulty, isMultiplication = false) {
        let max;
        switch (difficulty) {
            case 1:
                max = isMultiplication ? 5 : 10;
                break;
            case 2:
                max = isMultiplication ? 10 : 20;
                break;
            case 3:
                max = isMultiplication ? 15 : 50;
                break;
            default:
                max = 10;
        }
        return Math.floor(Math.random() * max) + 1;
    }

    checkAnswer(userAnswer, correctAnswer) {
        const userNum = parseInt(userAnswer, 10);
        return !isNaN(userNum) && userNum === correctAnswer;
    }
}

export default MathEngine;

