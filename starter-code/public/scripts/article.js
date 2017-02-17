'use strict';

function Article (opts) {
  // REVIEW: Convert property assignment to a new pattern. Now, ALL properties of `opts` will be
  // assigned as properies of the newly created article object. We'll talk more about forEach() soon!
  // We need to do this so that our Article objects, created from DB records, will have all of the DB columns as properties (i.e. article_id, author_id...)
  Object.keys(opts).forEach(function(e) {
    this[e] = opts[e]
  }, this);
}

Article.all = [];

// ++++++++++++++++++++++++++++++++++++++

// REVIEW: We will be writing documentation today for the methods in this file that handles Model layer of our application. As an example, here is documentation for Article.prototype.toHtml(). You will provide documentation for the other methods in this file in the same structure as the following example. In addition, where there are TODO comment lines inside of the method, describe what the following code is doing (down to the next TODO) and change the TODO into a DONE when finished.

/**
 * OVERVIEW of Article.prototype.toHtml():
 * - A method on each instance that converts raw article data into HTML
 * - Inputs: nothing passed in; called on an instance of Article (this)
 * - Outputs: HTML of a rendered article template
 */
Article.prototype.toHtml = function() {
  // DONE: Retrieves the  article template from the DOM and passes the template as an argument to the Handlebars compile() method, with the resulting function being stored into a variable called 'template'.
  var template = Handlebars.compile($('#article-template').text());

  // DONE: Creates a property called 'daysAgo' on an Article instance and assigns to it the number value of the days between today and the date of article publication
  this.daysAgo = parseInt((new Date() - new Date(this.publishedOn))/60/60/24/1000);

  // DONE: Creates a property called 'publishStatus' that will hold one of two possible values: if the article has been published (as indicated by the check box in the form in new.html), it will be the number of days since publication as calculated in the prior line; if the article has not been published and is still a draft, it will set the value of 'publishStatus' to the string '(draft)'
  this.publishStatus = this.publishedOn ? `published ${this.daysAgo} days ago` : '(draft)';

  // DONE: Assigns into this.body the output of calling marked() on this.body, which converts any Markdown formatted text into HTML, and allows existing HTML to pass through unchanged
  this.body = marked(this.body);

// DONE: Output of this method: the instance of Article is passed through the template() function to convert the raw data, whether from a data file or from the input form, into the article template HTML
  return template(this);
};

// ++++++++++++++++++++++++++++++++++++++

// DONE (toto)
/**
 * OVERVIEW of
 * - A method on each instance of Article that sorts and returns the instances of Article by date published and pushes each instance into an empty array called Article.all (all is a property of Article).
 * - Inputs: rows as an input to the function loadAll, which is a method on the Article object.
 * - Outputs: This function populates the empty array Article.all with individual instances of Article in order of date published.
 */
Article.loadAll = function(rows) {
  // DONE: A method on the rows input that uses an anonymous callback function to compare 2 instances of Article are sorted by the date published. Callback function is executed when row.sort is invoked.
  rows.sort(function(a,b) {
    return (new Date(b.publishedOn)) - (new Date(a.publishedOn));
  });

  // DONE: A method on rows input by which each instance of Article is pushed into an array, Article.all, in order of date published.
  rows.forEach(function(ele) {
    Article.all.push(new Article(ele));
  })
};

// ++++++++++++++++++++++++++++++++++++++

// DONE:
/**
 * OVERVIEW of
 * - The fetchAll function, a method on Article, requests data from the server for the /articles url page. After, if results already exist in the database, then they will be loaded via the loadAll method and the fetchAll method will be called via the callback function. If results do not exist, then the json file will be retrieved and a new instance of Article object will be created for each piece of rawData and be inserted as a record in the database. Then the .fetchAll function will be called on itself. For exceptions to the .then cases, such as null values, an error will be rendered in the console.
 * - Inputs: the input of the .fetchAll method is a callback function.
 * - Outputs: The output of the method is that the contents of the database are retrieved, whether they already exist or they need to be created (via the if statement below).
 */
Article.fetchAll = function(callback) {
  // DONE: Below is a method requesting data from the server via an HTTP GET request. The URL being linked/ accessed is "/articles" from the main page.
  $.get('/articles')
  // DONE: After the request to the server is made for the url "/articles," a .then handler is created with an input of a callback function which determines if records exist already in the database or not, with specific instructions for how to proceed in each case.
  .then(
    function(results) {
      if (results.length) { // If records exist in the DB
        // DONE: Under the condition that records for the page exist in the database, the method loadAll, which is a method on Article, will be called with the input "results," indicating an instance of Article. After, a callback function is called, named in the input of the fetchAll method, to call the fetchAll method.
        Article.loadAll(results);
        callback();
      } else { // if NO records exist in the DB
        // DONE: If no records of results exist in the database, then the server retrieves the JSON file through the url "./data/hackerIspum.json." After the file is retrieved, a callback function with the input rawData is called. Within this function, the method .forEach is called on rawData, indicating that the following function will be called on each instance of rawData. A callback function is created within the .forEach method in which a variable article is created as a new instance of the object Article for each instance of rawData. After article variable is created, the method on the variable article, which is an instance on the Article object, named insertRecord is called, which inserts the new article instance into the database as a new record.
        $.getJSON('./data/hackerIpsum.json')
        .then(function(rawData) {
          rawData.forEach(function(item) {
            let article = new Article(item);
            article.insertRecord(); // Add each record to the DB
          })
        })
        // DONE: Remaining within the "else" portion of the if statement and utilizing the JSON file called in the .getJSON method above, after creating a new instance of Article object and inserting it into the database for each instance of rawData, the lines below create a callback function which calls the Article.fetchAll method. When the fetchAll method is called again, the database entries will already exist and the loadAll function will be rendered.
        .then(function() {
          Article.fetchAll(callback);
        })
        // DONE: the .catch handler is a means by which os catching any exceptions to the .then handler above, such as a null value. In this case, .catch has an input of a callback function with an err input (for error) which produces a console error if/when called.
        .catch(function(err) {
          console.error(err);
        });
      }
    }
  )
};

// ++++++++++++++++++++++++++++++++++++++

// DONE:
/**
 * OVERVIEW of
 * - This method deletes the data in table "/articles" when called (executing the D portion of the CRUD framework)
 * - Inputs: the method takes a parameter of a callback function.
 * - Outputs: The output of the method is the database table is deleted, the data is logged in the console, and the function is called back on itself if the callback input is true.
 */
Article.truncateTable = function(callback) {
  // DONE: jQuery.ajax performs asynchronous HTTP requests, where ajax is a method on jQuery. Below is a delete request to delete the data in the table associated with '/articles'
  $.ajax({
    url: '/articles',
    method: 'DELETE',
  })
  // DONE: After the table is deleted, a callback function with an input of data is called, which console.logs the data onput. In addition, if the callback is truthy, then the callback function (input in truncateTable method) will be executed.
  .then(function(data) {
    console.log(data);
    if (callback) callback();
  });
};

// ++++++++++++++++++++++++++++++++++++++

// DONE:
/**
 * OVERVIEW of
 * - This method creates a new record in the database for each instance of the Article object.
 * - Inputs: callback function is the input fo the insertRecord method on Article.
 * - Outputs: the output is a new record in the database for each instance of Article.
 */
Article.prototype.insertRecord = function(callback) {
  // DONE: jQuery.ajax performs asynchronous HTTP requests, where ajax is a method on jQuery. Below is a post request to add a record into the database table on the url "/articles." Within the method, there is an object that equates the record key with the object constructor.
  $.post('/articles', {author: this.author, authorUrl: this.authorUrl, body: this.body, category: this.category, publishedOn: this.publishedOn, title: this.title})
  // DONE: After the record is created using the article constructor, the .then method creates a callback function with an input of data which produces a console.log of the data and a callback function is executed if the value of callback is true.
  .then(function(data) {
    console.log(data);
    if (callback) callback();
  })
};

// ++++++++++++++++++++++++++++++++++++++

// DONE
/**
 * OVERVIEW of
 * - The deleteRecord method deletes a record within the /articles table.
 * - Inputs: the methos takes in a parameter of callback, a function called later on within the method to call the method on itself.
 * - Outputs: the output is a record of /article (instance of Articles object ) is deleted from the /article table
 */
Article.prototype.deleteRecord = function(callback) {
  // DONE: jQuery.ajax performs asynchronous HTTP requests, where ajax is a method on jQuery. Below is a delete request to delete a record from the database table on the url "/articles" (followed by the jQuery of the article id for the instance).
  $.ajax({
    url: `/articles/${this.article_id}`,
    method: 'DELETE'
  })
  // DONE: After the record is deleted, the .then method creates a callback function with an input of data which produces a console.log of the data and a callback function is executed if the value of callback is true.
  .then(function(data) {
    console.log(data);
    if (callback) callback();
  });
};

// ++++++++++++++++++++++++++++++++++++++

// DONE
/**
 * OVERVIEW of
 * - The updateRecord method updates a record in the /articles table (instance of Article object). This is helpful if there is an error or change to be made in a single field of a single record.
 * - Inputs: the method has a parameter of callback, a function called later to render the updateRecord method on itself.
 * - Outputs: the otuput of this method is that the record in the /articles table will be updated
 */
Article.prototype.updateRecord = function(callback) {
  // DONE: Below is a delete request to delete a record from the database table on the table /articles at url "/articles" (followed by the jQuery of the article id for the instance).
  $.ajax({
    url: `/articles/${this.article_id}`,
    method: 'PUT',
    data: {  // DONE: the object Data is created within the object of the ajax method in order to update the records corresponding to the object constructor and record key.
      author: this.author,
      authorUrl: this.authorUrl,
      body: this.body,
      category: this.category,
      publishedOn: this.publishedOn,
      title: this.title
    }
  })
  // DONE: After the record is updates, the .then method creates a callback function with an input of data which produces a console.log of the data and a callback function is executed if the value of callback is true.
  .then(function(data) {
    console.log(data);
    if (callback) callback();
  });
};
