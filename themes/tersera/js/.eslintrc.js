/* eslint-disable linebreak-style */
module.exports = {
    'env': {
        'browser': true,
        'es2021': true,
    },

    'extends': [
        'google',
    ],

    'parserOptions': {
        'ecmaVersion': 12,
        'sourceType': 'module',
    },

    'rules': {
        'indent': [
            'error',
            4,
            {
                'SwitchCase': 1,
                'ignoreComments': true,
            },
        ],
        'linebreak-style': 0,
        'max-len': [
            'error',
            {
                'ignoreTemplateLiterals': true,
                'ignoreRegExpLiterals': true,
                'ignoreStrings': true,
                'ignoreComments': true,
            },
        ],
    },
};
