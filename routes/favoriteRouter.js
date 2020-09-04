var express = require('express');
const bodyParser = require('body-parser');
var mongoose = require('mongoose');

var authenticate = require('../authenticate');
var cors = require('./cors');
const Favorites = require('../models/favorites');
const { verify } = require('jsonwebtoken');
const { authorize } = require('passport');
var Dishes = require('../models/dishes');
const { populate } = require('../models/favorites');

var favoriteRouter = express.Router();
favoriteRouter.use(bodyParser.json());


favoriteRouter.route('/')
.options(cors.corsWithOptions, (req, res) => { res.sendStatus(200) })
  .get(cors.cors, authenticate.verifyUser, (req, res, next) => {
    Favorites.find({})
      .populate('user')
      .populate('dishes')
      .then((favdishes) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(favdishes);
      }, (err) => next(err))
      .catch((err) => next(err));
  })
  .post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    console.log('req.body._id=' + req.body._id);
    const newFav = new Favorites({
      _id: new mongoose.Types.ObjectId(),
      user: req.user._id,
      dishes: [req.body._id]
    });
    Favorites.create(newFav)
      .then((favdish) => {
        console.log('Favorite Created ', favdish);
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(favdish);
      }, (err) => next(err))
      .catch((err) => next(err));
  })
  .put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    res.statusCode = 403;
    res.end('PUT operation is not supported on /favorites');
  })
  .delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorites.remove({})
      .then((resp) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(resp);
      }, (err) => next(err))
      .catch((err) => next(err));
  })


favoriteRouter.route('/:dishId')
  .options(cors.corsWithOptions, (req, res) => { res.sendStatus(200) })
  .post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    console.log('req=' + req);
    Favorites.findOne({"user": req.user._id})
    .then((favorites) => {
      if (favorites == null) {
        const newFav = new Favorites({
          _id: new mongoose.Types.ObjectId(),
          user: req.user._id,
          dishes: [req.params.dishId]
        });
        Favorites.create(newFav)
          .then((favdish) => {
            console.log('Favorite Created ', favdish);
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(favdish);
          }, (err) => next(err))
          .catch((err) => next(err));
          }
      else {
        favorites.dishes.push(req.params.dishId);
        favorites.save()
        .then((favorites) => {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.json(favorites);
        },(err) => next(err))
        .catch((err) => next(err));
      }
    }, (err) => next(err))
    .catch((err) => next(err));
  })
  .delete(cors.corsWithOptions,authenticate.verifyUser,(req, res, next) => {
    Favorites.findOne({"dishes": req.params.dishId})
        .then((favorite) => {
          console.log('favorite= ' + JSON.stringify(favorite));
          favorite.dishes.pull(req.params.dishId);
          favorite.save()
          .then((favorite) => {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(favorite);
          }, (err) => next(err));
        }, (err) => next(err))
        .catch((err) => next(err));
});

module.exports = favoriteRouter;