const winston = require('winston');

var options = {
    file: {
        level: 'info',
        filename: __dirname + '/log/app.log',
        handleExceptions: true,
        //json: true,
        json: false,
        maxsize: 5242880, // 5MB
        maxFiles: 5,
        colorize: false,
    }
}

const logger = new (winston.Logger)({
    level: 'info',
    //format: winston.format.json(),
    format: winston.format.combine(
        winston.format(function dynamicContent(info, opts) {
            info.message = '' + info.message;
            return info;
        })(),
        winston.format.simple()
    ),
    transports: [
        new winston.transports.File(options.file),
        new (winston.transports.Console)({
            json: true,
            colorize: true
        })
    ]
});


/*
* By default, morgan outputs to the console only, so let's define a stream function that will be able to get morgan-generated output into the winston log files.
* We will use the info level so the output will be picked up by both transports (file and console):
* */
logger.stream = {
    write: function(message, encoding) {
        logger.info(message);
    },
};

module.exports = logger;