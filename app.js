var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var logger = require('morgan');
var compress = require('compression');
const expressValidation = require('express-validation');
const APIError = require('./util/APIError');
var methodOverride = require('method-override');
var swaggerUi = require('swagger-ui-express'), swaggerDocument = require('./swagger.json');

const expressWinston = require('express-winston');
const winstonInstance = require('winston');


//Load database
var {items ,mod ,cat} = require('./db/loaddb');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

//app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(compress());
app.use(methodOverride());


// enable detailed API logging in dev env
//if (config.env === 'development') {
    expressWinston.requestWhitelist.push('body'); // Array of request body to log
    expressWinston.responseWhitelist.push('body');
    app.use(expressWinston.logger({
        transports: [
            new winstonInstance.transports.File({
                level: 'info',
                filename: __dirname + '/log/app.log',
                handleExceptions: true,
                //json: true,
                json: false,
                maxsize: 5242880, // 5MB
                maxFiles: 5,
                colorize: false,
            }),
            new (winstonInstance.transports.Console)({
                json: true,
                colorize: true
            })
        ],
        format: winstonInstance.format.combine(
            winstonInstance.format(function dynamicContent(info, opts) {
                info.message = '' + info.message;
                return info;
            })(),
            winstonInstance.format.simple()
        ),
        meta: true, // optional: log meta data about request (defaults to true)
        msg: 'HTTP {{req.method}} {{req.url}} {{res.statusCode}} {{res.responseTime}}ms',
        colorStatus: true // Color the status code (default green, 3XX cyan, 4XX yellow, 5XX red).
    }));
//}

app.use(express.static(path.join(__dirname, 'public')));

//route
app.use('/', indexRouter);
app.use('/users', usersRouter);

//swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));


// if error is not an instanceOf APIError, convert it.
app.use((err, req, res, next) => {
    if (err instanceof expressValidation.ValidationError) {
        // validation error contains errors which is an array of error each containing message[]
        const unifiedErrorMessage = err.errors.map(error => error.messages.join('. ')).join(' and ');
        const error = new APIError(unifiedErrorMessage, err.status, true);
        return next(error);
    } else if (!(err instanceof APIError)) {
        const apiError = new APIError(err.message, err.status, err.isPublic);
        return next(apiError);
    }

    return next(err);
});

// catch 404 and forward to error handler
app.use((req, res, next) => {
    const err = new APIError('API not found', httpStatus.NOT_FOUND);
    return next(err);
});

// log error in winston transports except when executing test suite
//if (config.env !== 'test') {
    app.use(expressWinston.errorLogger({
        winstonInstance
    }));
//}


// error handler, send stacktrace only during development
app.use((err, req, res, next) => // eslint-disable-line no-unused-vars
    res.status(err.status).json({
        message: err.isPublic ? err.message : httpStatus[err.status],
        stack: true ? err.stack : {}
    })
);


//console.log('start start');

module.exports = app;
