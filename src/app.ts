import cookieParser from 'cookie-parser';
import * as dotenv from 'dotenv';
import express from 'express';
import { Request, Response, NextFunction } from 'express';
import createError from 'http-errors';
import { HttpError } from 'http-errors';
import logger from 'morgan';
import path from 'path';
import indexRouter from './routes/index';
import usersRouter from './routes/users';
import { Sequelize } from 'sequelize'

dotenv.config()
const username = process.env.USERNAME;
const password = process.env.PWORD;

const sequelize = new Sequelize(`postgres://${username}:${password}@127.0.0.1:5432/footman`);


const checkAuthentication = async function(){
    await sequelize.authenticate().catch((error)=>{
      console.error('Authentication has failed',error)
    })
    console.log('Authentication check complete')
}

checkAuthentication()

const app = express();

// view engine setup
app.set('views', path.join(__dirname, '../', 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function(req:Request, res:Response, next:NextFunction) {
  next(createError(404));
});

// error handler
app.use(function(err: HttpError, req: Request, res: Response, next: NextFunction) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
