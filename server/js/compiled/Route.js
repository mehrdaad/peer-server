// Generated by CoffeeScript 1.6.2
(function() {
  'Defines the Route model for handing dynamic paths and \ndefined path parameters.\n\nTODO: there should be verification on the UI-end that only valid Routes are initialized.\nSpecifically: \n  - name should be a valid Javascript function name (nonempty, no invalid characters, no spaces, etc)\n  - routePath should be a valid path (tokens separated by / without invalid characters in the tokens.\n      some of the tokens can be of the form <token> but there shouldn\'t be any other angle-brackets \n      except at the start and end.)\n  - reserved words: database, static_file, params  (inspect getExecutableFunction for most up-to-date)';
  var _ref,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  window.Route = (function(_super) {
    __extends(Route, _super);

    function Route() {
      this.validate = __bind(this.validate, this);
      this.sanitizePathPart = __bind(this.sanitizePathPart, this);
      this.setParsedPath = __bind(this.setParsedPath, this);
      this.getPrettyCurrentDate = __bind(this.getPrettyCurrentDate, this);
      this.getExecutableFunction = __bind(this.getExecutableFunction, this);      _ref = Route.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    Route.prototype.defaults = {
      errorMessage: "",
      name: "",
      routePath: "",
      routeCode: "",
      paramNames: [],
      options: {},
      isProductionVersion: false,
      hasBeenEdited: false
    };

    Route.prototype.relations = [
      {
        type: Backbone.HasOne,
        key: "productionVersion",
        relatedModel: "Route"
      }
    ];

    Route.prototype.initialize = function() {
      this.setParsedPath();
      this.set("errorMessage", "Path has not yet been executed.");
      return this.on("change:routePath", this.setParsedPath);
    };

    Route.prototype.getExecutableFunction = function(urlParams, dynamicParams, staticFileFcn, userDatabase, clientSession) {
      var fcn, paramNames, text,
        _this = this;

      text = "(function (";
      paramNames = this.get("paramNames");
      if (paramNames && paramNames.length > 0) {
        text += paramNames.join(", ") + ", ";
      }
      text += "params" + ") {";
      text += this.get("routeCode") + "})";
      text += "(";
      if (dynamicParams && dynamicParams.length > 0) {
        dynamicParams = _.map(dynamicParams, function(param) {
          return '"' + param + '"';
        });
        text += dynamicParams.join(",") + ", ";
      }
      text += JSON.stringify(urlParams) + ")";
      fcn = function() {
        var cryptoRandom, database, error, evaluation, hash, render_template, result, session, static_file;

        database = userDatabase;
        static_file = staticFileFcn;
        session = clientSession;
        hash = function(value) {
          return "" + CryptoJS.SHA256(value);
        };
        cryptoRandom = function(value) {
          return CryptoJS.lib.WordArray.random(value) + "";
        };
        render_template = function(filename, context) {
          var template;

          template = static_file(filename, context);
          if (!template || template.length === 0) {
            throw "Template '" + filename + "' does not exist";
          }
          return window.UserTemplateRenderer.renderTemplate(template, context);
        };
        result = "";
        try {
          evaluation = eval(text);
          if (evaluation) {
            result = evaluation;
          }
        } catch (_error) {
          error = _error;
          console.error("Eval error: " + error);
          error = "Evaluation error in function: " + error;
          _this.set("errorMessage", error);
          return {
            "error": error
          };
        }
        _this.set("errorMessage", "Last execution at " + _this.getPrettyCurrentDate() + " was successful!");
        return {
          "result": result
        };
      };
      return fcn;
    };

    Route.prototype.getPrettyCurrentDate = function() {
      var date, minutes, now, time;

      now = new Date();
      minutes = now.getMinutes();
      if (minutes < 10) {
        minutes = "0" + minutes;
      }
      time = now.getHours() + ":" + minutes;
      date = now.getMonth() + "-" + now.getDate() + "-" + now.getFullYear();
      return time + " on " + date;
    };

    Route.prototype.setParsedPath = function() {
      var isParamPart, paramNames, part, path, pathParts, regexParts, _i, _len,
        _this = this;

      isParamPart = function(part) {
        return part.length > 2 && part.charAt(0) === "<" && part.charAt(part.length - 1) === ">";
      };
      path = this.get("routePath");
      pathParts = path.split("/");
      paramNames = [];
      regexParts = [];
      if (pathParts.length === 0) {
        return paramNames;
      }
      pathParts[pathParts.length - 1] = this.sanitizePathPart(_.last(pathParts));
      for (_i = 0, _len = pathParts.length; _i < _len; _i++) {
        part = pathParts[_i];
        if (isParamPart(part)) {
          paramNames.push(part.slice(1, -1));
          regexParts.push("([^/]+)");
        } else {
          regexParts.push(part);
        }
      }
      this.pathRegex = "^/?" + regexParts.join("/") + "/?$";
      return this.set("paramNames", paramNames);
    };

    Route.prototype.sanitizePathPart = function(part) {
      part = part.split("#")[0];
      part = part.split("&")[0];
      return part;
    };

    Route.prototype.validate = function(attrs) {
      var invalid;

      invalid = {};
      if (_.has(attrs, "name") && !/^[$A-Z_][0-9A-Z_$]*$/i.test(attrs.name)) {
        invalid.name = true;
      }
      if (_.has(attrs, "routePath") && !/^(\/([A-Z\d_-]+|<[A-Z\d_-]+>))+$/i.test(attrs.routePath)) {
        invalid.routePath = true;
      }
      if (!_.isEmpty(invalid)) {
        return invalid;
      }
    };

    return Route;

  })(Backbone.RelationalModel);

}).call(this);
