var app = angular.module('directory', ['ui.router'])

app.config(['$stateProvider', '$urlRouterProvider',
           function (stateProvider, urlRouterProvider) {
             
             stateProvider
               .state('addRec', {
                 url: '/addrecord',
                 templateUrl: '/addrecord.html',
                 controller: 'MainCtrl',
               })
               .state('home', {
                 url: '/home',
                 templateUrl: '/home.html',
                 controller: 'MainCtrl',
                 resolve: {
                    recordPromise: ['records', function(records) {
                      console.log($('#main_search').val());
                      //console.log($scope.nameFilter);
                      return records.getAll();
                      
                    }]
                 }
               })
               .state('landing', {
                 url: '/landing',
                 templateUrl: '/landing.html',
                 controller: 'MainCtrl',
               })
               .state('records', {
                 url:'/records/:id',
                 templateUrl: 'records.html',
                 controller: 'RecordsCtrl',
                 resolve: {
                   record: ['$stateParams', 'records', function($stateParams, records) {
                      return records.get($stateParams.id);
                    }]
                 }
               })
               .state('login', {
                 url: '/login',
                 templateUrl: '/login.html',
                 controller: 'AuthCtrl',
                 onEnter: ['$state', 'auth', function($state, auth){
                    if(auth.isLoggedIn()){
                    $state.go('landing');
                 }}]
               })
               .state('register', {
                 url: '/register',
                 templateUrl: '/register.html',
                 controller: 'AuthCtrl',
                 onEnter: ['$state', 'auth', function($state, auth){
                    if(auth.isLoggedIn()){
                    $state.go('landing');
                 }}]
               });
               
             
             urlRouterProvider.otherwise('landing');
           }]
);

app.factory('records', ['$http','auth', function($http, auth) {
  var o = {
    records: []
  };
  
  o.getAll = function () {
    return $http.get('/records').success(function(data){
      angular.copy(data, o.records);
  })};
  
  o.create = function (record) {
    console.log("create record");
    return $http.post('/records', record, {
      headers: {Authorization: 'Bearer '+auth.getToken()}
    }).success(function(data){
    o.records.push(data);
    })
  };
  
  o.upvote = function (record) {
    console.log(auth.getToken());
     return $http.put('/records/' + record._id + '/upvote', {
      headers: {Authorization: 'Bearer '+auth.getToken()}
    })
    .success(function(data){
      record.upvotes += 1;
    });
  };
  
  o.get = function (id) {
    return $http.get('/records/' + id)
    .then(function(res){
            return res.data;
    });
  }
  
  o.addComment = function (id, comment) {
    return $http.post('/records/' + id + '/comments', comment, {
      headers: {Authorization: 'Bearer '+auth.getToken()}
    });
  }
  
  o.upvoteComment = function(record, comment) {
    console.log(auth.getToken());
    return $http.put('/records/' + record._id + '/comments/'+ comment._id + '/upvote', null, {
      headers: {Authorization: 'Bearer '+auth.getToken()}
    })
    .success(function(data){
      comment.upvotes += 1;
    });
  };
  
  return o;
}]);

app.factory('auth', ['$http', '$window', function ($http, $window) {
  var auth = {};
  
  auth.saveToken = function (token) {
    $window.localStorage['flapper-news-token'] = token;    
  };
  
  auth.getToken = function () {
    return $window.localStorage['flapper-news-token'];
  };
  
  auth.isLoggedIn = function () {
    var token = auth.getToken () ;
    if (token) {
      var payload = JSON.parse($window.atob(token.split('.')[1]));
      return payload.exp > Date.now() / 1000;      
    } else {
      return false;
    }
  };
  
  auth.currentUser = function () {
    if (auth.isLoggenIn) {
      var token = auth.getToken();
      var payload = JSON.parse($window.atob(token.split('.')[1]));
      return payload.username;
    }        
  };
  
  auth.register = function(user) {
    return $http.post('/register', user).success(function (data) {
      auth.saveToken(data.token);
    });
  };
  
  auth.login = function(user) {
    return $http.post('/login',user).success(function(data) {
      auth.saveToken(data.token);
    });
  };
  
  auth.logout = function(){
    $window.localStorage.removeItem('flapper-news-token');
  };
  
  return auth;
}]);

app.controller('MainCtrl', [
  '$scope', 'records', 'auth',
  function ($scope, records, auth) {
    
    $scope.range = function(min, max, step){
    step = step || 1;
    var input = [];
    for (var i = min; i <= max; i += step) input.push(i);
    return input;
     };
    
    console.log("main");
     $scope.tab = 1;
    $scope.setTab = function(newTab){
      $scope.tab = newTab;
    };

    $scope.isSet = function(tabNum){
      return $scope.tab === tabNum;
    };
  
    $scope.isLoggedIn = auth.isLoggedIn;
    $scope.records = records.records;
    
    $scope.addRecord = function() {
      console.log("addRecord");
      if(!$scope.bizname || $scope.bizname === '') return;
      
      
      records.create({
          bizname: $scope.bizname,
          address: $scope.address,
          email: $scope.email,
          phone: $scope.phone,
          category: $scope.category,
          link:$scope.link
        });
      $scope.bizname="";
      $scope.address="";  
      $scope.email="";
      $scope.phone="";  
      $scope.category="";  
      $scope.link="";
    }
    
    $scope.incrementUpvote = function (record) {
      console.log(record);
      records.upvote(record);
    }
  }  
]);

app.controller('RecordsCtrl', [
  
  '$scope', 'records', 'record', 'auth', 
  function ($scope, records, record, auth) {
    $scope.isLoggedIn = auth.isLoggedIn;
    $scope.record= record;
    
    $scope.addComment = function () {
      if ($scope.body === "") {return;};
      records.addComment(record._id, {
          body: $scope.body,
          author: 'user',
          score:$scope.score,
          }).success(function(comment) {
              $scope.record.comments.push(comment);
          });
      $scope.body = '';
      
    }
    
    $scope.incrementUpvotes = function(comment){
      console.log(comment);
      records.upvoteComment(record, comment);
    };
    
  }]  
);

app.controller('AuthCtrl', ['$scope', '$state', 'auth', function($scope, $state, auth) {
  $scope.user = {};
  
  $scope.register = function () {
    auth.register($scope.user).error(function(error) {
      $scope.error = error;
    }).then(function() {
      $state.go('landing');
    });
  };
  
  $scope.login = function(){
    auth.login($scope.user).error(function(error){
      $scope.error = error;
    }).then(function(){
      $state.go('landing');
    });
  };
  
}]);

app.controller('NavCtrl', [
'$scope',
'auth',
function($scope, auth){
  $scope.isLoggedIn = auth.isLoggedIn;
  $scope.currentUser = auth.currentUser;
  $scope.logout = auth.logout;

}]);