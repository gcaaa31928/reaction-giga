"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function () {
  /**
   * Send Email job
   *
   * Example usage:
   * new Job(Jobs, "sendEmail", { from, to, subject, html }).save();
   */
  var sendEmail = _collections.Jobs.processJobs("sendEmail", {
    pollInterval: 5 * 60 * 1000, // poll every 5 mins as a backup - see the realtime observer below
    workTimeout: 2 * 60 * 1000, // fail if it takes longer than 2mins
    payload: 20
  }, function (jobs, callback) {
    jobs.forEach(function (job) {
      var _job$data = job.data,
          from = _job$data.from,
          to = _job$data.to,
          subject = _job$data.subject,
          html = _job$data.html;


      if (!from || !to || !subject || !html) {
        var msg = "Email job requires an options object with to/from/subject/html.";
        _api.Logger.error("[Job]: " + msg);
        return job.fail(msg, { fatal: true });
      }

      var jobId = job._doc._id;

      _collections.Emails.update({ jobId: jobId }, {
        $set: {
          from: from,
          to: to,
          subject: subject,
          html: html,
          status: "processing"
        }
      }, {
        upsert: true
      });

      if (!_api.Reaction.Email.getMailUrl()) {
        _collections.Emails.update({ jobId: jobId }, {
          $set: {
            status: "failed"
          }
        });
        var _msg = "Mail not configured";
        _api.Logger.error(_msg);
        return job.fail(_msg);
      }

      var config = _api.Reaction.Email.getMailConfig();
      _api.Logger.debug(config, "Sending email with config");

      var transport = _nodemailer2.default.createTransport(config);

      transport.sendMail({ from: from, to: to, subject: subject, html: html }, Meteor.bindEnvironment(function (error) {
        if (error) {
          _collections.Emails.update({ jobId: jobId }, {
            $set: {
              status: "failed"
            }
          });
          _api.Logger.error(error, "Email job failed");
          return job.fail(error.toString());
        }
        _collections.Emails.update({ jobId: jobId }, {
          $set: {
            status: "completed"
          }
        });
        _api.Logger.debug("Successfully sent email to " + to);
        return job.done();
      }));

      return true;
    });

    return callback();
  });

  // Job Collection Observer
  // This processes an email sending job as soon as it's submitted
  _collections.Jobs.find({
    type: "sendEmail",
    status: "ready"
  }).observe({
    added: function added() {
      sendEmail.trigger();
    }
  });
};

var _nodemailer = require("nodemailer");

var _nodemailer2 = _interopRequireDefault(_nodemailer);

var _collections = require("/lib/collections");

var _api = require("/server/api");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }