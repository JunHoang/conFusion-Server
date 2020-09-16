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
    Favorites.findOne({user: req.user._id}, (err, favorite) => {
      if(err) next(err);

      if(!favorite) {
        Favorites.create({user: req.user._id})
        .then((favorite) => {
          for(i=0; i<req.body.length; i++)
            if(favorite.dishes.indexOf(req.body[i]._id))
              favorite.dishes.push(req.body[i]);
            favorite.save()
            .then((favorite) => {
              Favorites.findById(favorite._id)
              .populate('user')
              .populate('dishes')
              .then((favorite) => {
                console.log('Favorite created');
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(favorite);
              })
            })
            .catch((err) =>{
              return next(err);
            })
        })
        .catch((err) =>{
          return next(err);
        })
      }
      else {
        for (i = 0; i < req.body.length; i++)
          if (favorite.dishes.indexOf(req.body[i]._id))
            favorite.dishes.push(req.body[i]);
          favorite.save()
          .then((favorite) => {
            Favorites.findById(favorite._id)
            .populate('user')
            .populate('dishes')
            .then((favorite) => {
              console.log('Favorite created');
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.json(favorite);
            })
          })
          .catch((err) =>{
            return next(err);
          })
      }
    })
  })
  .put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    res.statusCode = 403;
    res.end('PUT operation is not supported on /favorites');
    res.setHeader('Content-Type', 'text/plain');
  })
  .delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorites.findOneAndRemove({user: req.user._id}, (err, resp, next) => {
      if(err) return next(err);
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.json(resp); 
    })
  })


favoriteRouter.route('/:dishId')
  .options(cors.corsWithOptions, (req, res) => { res.sendStatus(200) })
  .get(cors.cors, authenticate.verifyUser, (req, res,next) => {
    Favorites.findOne({user: req.user._id})
    .then((favorites) => {
      if (!favorites) {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        return res.json({"exists": false, "favorites": favorites});
      }
      else {
        if (favorites.dishes.indexOf(req.params.dishId) < 0 ) {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          return res.json({"exists": false, "favorites": favorites});
        }
        else {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          return res.json({"exists": true, "favorites": favorites});
        }
      }
    }, (err) => next(err))
    .catch((err) => next(err));
  })
.post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
  Favorites.findOne({user: req.user._id}, (err, favorite) =>{
    if (err) return next(err);
    
    if(!favorite) {
      Favorites.create({user: req.user._id})
      .then((favorite) => {
        favorite.dishes.push({"_id": req.params.dishId});
        favorite.save()
        .then((favorite) =>{
          Favorites.findById(favorite._id)
          .populate('user')
          .populate('dishes')
          .then((favorite) => {
            console.log('Favorite created');
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(favorite);
          })
        })
        .catch((error) => {
          return next(error);
        });
      })
      .catch((error) => {
        return next(error);
      })
    }
    else{
      if(favorite.dishes.indexOf(req.params.dishId) < 0 ) {
        favorite.dishes.push({"_id": req.params.dishId});
        favorite.save()
        .then((favorite) => {
          Favorites.findById(favorite._id)
          .populate('user')
          .populate('dishes')
          .then((favorite) => {
            console.log('Favorite created');
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(favorite);
          })
        })
        .catch((error) => {
          return next(error);
        })
      }
      else{
        res.statusCode = 403;
        res.setHeader('Content-Type', 'text/plain');
        res.end('Dish ' + req.params.dishId + ' already added!');
      }
    }

  })
})
  .delete(cors.corsWithOptions,authenticate.verifyUser,(req, res, next) => {
    Favorites.findOne({user: req.user._id}, (err, favorite) => {
      if (err) return next(err);

      var index = favorite.dishes.indexOf(req.params.dishId);
      if( index >= 0) {
        favorite.dishes.splice(index, 1);
        favorite.save()
        .then((favorite) => {
          Favorites.findById(favorite._id)
          .populate('user')
          .populate('dishes')
          .then((favorite) => {
            console.log('Favorite created');
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(favorite);
          })
        })
        .catch ((err) => {
          return next(err);
        })
      }
      else {
        res.statusCode= 404;
        res.setHeader('Content-Type', 'text/plain');
        res.end('Dish ' + req.params._id + ' not in your favorite!')
      }
    })

});

module.exports = favoriteRouter;