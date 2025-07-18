const { validationResult } = require('express-validator');

const Resource = require('../models/resource');

exports.getAddResource = (req, res, next) => {
    res.render('admin/edit-resource', {
        pageTitle: 'Add Resource',
        path: '/admin/add-resource',
        editing: false,
        hasError: false,
        errorMessage: null,
        validationErrors: []
    });
};

exports.postAddResource = (req, res, next) => {
    const title = req.body.title;
    const author = req.body.author;
    const publicationYear = req.body.year;
    const genre = req.body.genre;
    const errors = validationResult(req);

    if(!errors.isEmpty()) {
        return res.render('admin/edit-resource', {
            pageTitle: 'Add Resource',
            path: '/admin/add-resource',
            editing: false,
            resource: {
                title,
                author,
                publicationYear,
                genre
            },
            hasError: true,
            errorMessage: errors.array()[0].msg,
            validationErrors: errors.array()
        });
    }

    const resource = new Resource(title, author, publicationYear, genre, null, req.user._id, true);
    resource.save()
    .then(result => {
        console.log('New Resource Created!');
        res.redirect('/admin/resources');
    })
    .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    });
};

exports.getResources = (req, res, next) => {
    let isAuthenticated = false;
    if (req.user) {
        isAuthenticated = !!req.user;
    }
    
    Resource.findByUserId(req.user._id.toString())
    .then(resources => {
        res.json({
            pageTitle: 'Admin Resources',
            path: '/admin/resources',
            resources: resources,
            isAuthenticated
        })
    })
    .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    });
};

exports.getEditResource = (req, res, next) => {
    const editMode = req.query.edit;
    if(!editMode) {
        res.redirect('/');
    }
    const resourceId = req.params.resourceId;

    Resource.findById(resourceId)
    .then(resource => {
        res.render('admin/edit-resource', {
            pageTitle: 'Edit Resource',
            path: '/admin/edit-resource',
            resource: resource,
            editing: editMode,
            hasError: false,
            errorMessage: null,
            validationErrors: []
        });
    })
    .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    });
};

exports.postEditResource = (req, res, next) => {
    const resourceId = req.body.resourceId;
    const title = req.body.title;
    const author = req.body.author;
    const publicationYear = req.body.year;
    const genre = req.body.genre;
    const availableStatus = req.body.availableStatus;
    const errors = validationResult(req);

    if(!errors.isEmpty()) {
        return res.render('admin/edit-resource', {
            pageTitle: 'Edit Resource',
            path: '/admin/edit-resource',
            editing: true,
            resource: {
                title,
                author,
                publicationYear,
                genre,
                _id: resourceId,
                availableStatus
            },
            hasError: true,
            errorMessage: errors.array()[0].msg,
            validationErrors: errors.array()
        });
    }

    Resource.findById(resourceId)
    .then(resource => {
        if (resource.userId.toString() !== req.user._id.toString()) {
            return res.redirect('/');
        }
        const newResource = new Resource(title, author, publicationYear, genre, resourceId, req.user._id, availableStatus);
        return newResource.save()
        .then(result => {
            console.log('updated resource');
            res.redirect('/admin/resources');
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
    })
    .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    });
};

exports.deleteResource = (req, res, next) => {
    const resourceId = req.params.resourceId;
    Resource.deleteByResourceIdANDUserId(resourceId, req.user._id.toString())
    .then(resource => {
        console.log('Destroyed resource!')
        res.status(200).json({ message: 'Resource deleted.' });
    })
    .catch(err => {
        res.status(500).json({ message: 'Deleting resource failed.' });
    });
}