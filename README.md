# Footman App


## Description

This is a football-themed basic CRUD app built with Express, Postgres, Sequelize and TypeScript.

Users are authorised to perform all operations about football players, teams and competitions

on a database of football-related information.

[Live Demo](https://footman.up.railway.app) (Currently not online all the time, so please excuse any inconvenience.)


## Remarks 

### General.

This was my first go at an unsupervised (so no tutorials or guidelines) CRUD app implementation with a MVC structure. 
I also switched from MongoDB to Postgres and Sequelize for this one. I had some challenges interfacing Sequelize with 
TypeScript to start with, as well as configuring postgres on my local machine, but other than that it was quite 
straightforward and satisfying.

### Models.

The models in this setup were three: Players, Teams, and Competitions. The Competition and the Team had a many-to-many relationship and the Player
belonged to one Team, which Team had many Players. This is not an ideal setup since it suffers from some redundant data when seasons are incorporated
because teams change from one season to another, so you end up having the same competition, team, and player for each season. A more memory-efficient
way might involve adding another layer of abstraction whereby a parent model with constant attributes (like name, for example) would have many instance
models associated to it with variable attributes (like age), and when a model is created it would be an instance model sewn up in associations with
instance models of other constant models. Without optimisation, this becomes a trade-off between memory and CPU usage though. 

### Cache-busting.

The 'Competition Index' page renders competitions on a seasonal basis. In the (academic) case where there is a lot of data, getting that amount of data
is expensive so I thought this was a good use-case for a cache, but I didn't want to set up a Worker just for this use-case, so I turned to cache-busting.

### Garbage collection.

In the course of this project, I learned about a V8 edge-case suggesting that closures are not garbage collected when they share a variable with other 
closures in their outer lexical environment and that variable is referenced by at least one closure of the set, even if it goes unused and is ultimately
garbage collected, which ends up causing memory leaks. The details are in David Glasser's [blog post](https://point.davidglasser.net/2013/06/27/surprising-javascript-memory-leak.html) and Meteor's [article](https://blog.meteor.com/an-interesting-kind-of-javascript-memory-leak-8b47d2e7f156).

When I read about this, I realised that I had a large footprint of closures in this project. It was impractical to refactor everything, so what I did
was identify some potential bottlenecks and ensured everything was null when it was not in use. 

### Special Mention: ChatGPT

ChatGPT was rolled out during this project's making so I naturally experimented with it. There were times when it helped me out with a few queries and it 
helped guide my thinking. That being said, I learned that expecting solutions to intractable problems can be dangerous, it is programmed to provide answers
and so it followed up with false positives at times. I tried not to make heavy use of it, because it can be easy to rely on it to generate boilerplate and
then keep prompting until it gets it right - but that is not programming, and I quite enjoy programming.

My general impression is that it can be quite helpful **if you already know what you are doing** and **you think critically about the advice it provides**.
  

## Debugging Account

Some of the bugs I struggled with in this project proved to be the most annoying kind: ultimately trivial, but time-consuming until you diagnose the problem.
Here are three that I jotted down in chronological order:

### Bug 1: Circular dependencies in the app.

    - The server was crashing every time I tried to run the app.
    - Learned that the Common JS standard in the compiled code had issues with circular dependencies.
    - Learned that the causal problem was the way I was defining the associations between models.
    - Resolved the issue by defining associations between models as a separate concern.

### Bug 2: `save` method in Sequelize does not save updates to associations.

    - The PUT controller would update some data but not others.
    - Learned that the updates which were not realised related to the records in the through table.
    - Perused the Sequelize documentation and they provide that "this method is not aware of eager loaded associations".
      (it's unfortunate that this is not documented in their guides)
    - Resolved the issue by saving the through table separately.


### Bug 3: Cache-control header does not work for server-side requests (quite obvious!).
    
    - Observed that sometimes the route handler data would run on the 'competitions index' page when expecting a cached response.
    - Identified that the issue was when I was pulling data by navigating to the route using Axios requests with server-side code.
    - Made a couple of curl requests and also refreshed the page from the browser before the obvious hit me.
    - Determined that the issue was absolutely embarrassing and proceeded to chastise myself through colourful subvocalisation.
    - Resolved the problem by using an in-memory cache for server-side purposes.


    







