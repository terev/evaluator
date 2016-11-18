# Evaluator
This script require Node.js >= 6.x

## Configuration
1. Set your Moodle credentials in the 'username' and 'password' fields
2. Set 'evaluation_text' with the String to find for the evaluation link
3. You can configure each evaluation in the 'evaluations' field using an Object or a String
    - String: The value of 'default_evaluation' will be used to evaluate the user
    - Object: The fields 'id' and 'evaluation' should be set for the user's custom evaluation