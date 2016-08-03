var moment = require('moment');	
module.exports = {
  //
  getDayBegin: function(numberOfDays) {
      var dayBegin = [];
      for (var i = 0; i <= numberOfDays; i++) {
        dayBegin[i] = moment().subtract(i, 'days').startOf('day').toDate().getTime();
      }
      return dayBegin;
  },
  //
  getDayEnd: function(numberOfDays) {
      var dayEnd = [];
      for (var i = 0; i <= numberOfDays; i++) {
        dayEnd[i] = moment().subtract(i, 'days').endOf('day').toDate().getTime();
      }
      return dayEnd;
  },
  getWeekBegin: function(numberOfWeeks) {
      var weekBegin = [];
      for (var i = 0; i <= numberOfWeeks; i++) {
        weekBegin[i] = moment().subtract(i, 'weeks').startOf('isoWeek').toDate().getTime();
      }
      return weekBegin;
  },
  //
  getWeekEnd: function(numberOfWeeks) {
      var weekEnd = [];
      for (var i = 0; i <= numberOfWeeks; i++) {
        weekEnd[i] = moment().subtract(i, 'weeks').endOf('isoWeek').toDate().getTime();
      }
      return weekEnd;
  },
  //
  getMonthBegin: function(numberOfMonths) {
      var monthBegin = [];
      for (var i = 0; i <= numberOfMonths; i++) {
        monthBegin[i] = moment().subtract(i, 'months').startOf('month').toDate().getTime();
      }
      return monthBegin;
  },
  //
  getMonthEnd: function(numberOfMonths) {
      var monthEnd = [];
      for (var i = 0; i <= numberOfMonths; i++) {
        monthEnd[i] = moment().subtract(i, 'months').endOf('month').toDate().getTime();
      }
      return monthEnd;
  },
  getYearBegin: function(numberOfYears) {
      var yearBegin = [];
      for (var i = 0; i <= numberOfYears; i++) {
        yearBegin[i] = moment().subtract(i, 'years').startOf('year').toDate().getTime();
      }
      return yearBegin;
  },
  //
  getYearEnd: function(numberOfYears) {
      var yearEnd = [];
      for (var i = 0; i <= numberOfYears; i++) {
        yearEnd[i] = moment().subtract(i, 'years').endOf('year').toDate().getTime();
      }
      return yearEnd;
  }
};
