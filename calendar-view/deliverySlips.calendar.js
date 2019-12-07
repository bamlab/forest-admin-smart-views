'use strict';
import Ember from 'ember';
import SmartViewMixin from 'client/mixins/smart-view-mixin';

let calendar = null;

export default Ember.Component.extend(SmartViewMixin.default, {
  store: Ember.inject.service(),
  conditionAfter: null,
  conditionBefore: null,
  loaded: false,
  calendarId: null,
  tooltipId: null,
  loadPlugin: function() {
    const that = this;
    Ember.run.scheduleOnce('afterRender', this, function() {
      if (this.get('viewList.recordPerPage') !== 50) {
        this.set('viewList.recordPerPage', 50);
        this.sendAction('updateRecordPerPage');
      }
      that.set('calendarId', `${this.get('element.id')}-calendar`);
      that.set('tooltipId', `${this.get('element.id')}-tooltip`);
      Ember.$.getScript('//unpkg.com/popper.js/dist/umd/popper.min.js', function() {
        Ember.$.getScript('//unpkg.com/tooltip.js/dist/umd/tooltip.min.js', function() {
          Ember.$.getScript(
            '//cdnjs.cloudflare.com/ajax/libs/fullcalendar/4.2.0/core/main.min.js',
            function() {
              Ember.$.getScript(
                '//cdnjs.cloudflare.com/ajax/libs/fullcalendar/4.2.0/daygrid/main.min.js',
                function() {
                  Ember.$.getScript(
                    '//cdnjs.cloudflare.com/ajax/libs/fullcalendar/4.2.0/timegrid/main.js',
                    function() {
                      const calendarEl = document.getElementById(that.get('calendarId'));

                      calendar = new FullCalendar.Calendar(calendarEl, {
                        header: {
                          left: 'title',
                          center: '',
                          right: 'today prev,next dayGridMonth,timeGridWeek',
                        },
                        allDaySlot: false,
                        plugins: ['dayGrid', 'timeGrid'],
                        defaultView: 'timeGridWeek',
                        defaultDate: new Date(),
                        viewRender: function(view, element) {
                          const field = that.get('collection.fields').findBy('field', 'datetime');

                          that.sendAction('fetchRecords', { page: 1 });
                        },
                        eventRender: function(eventData) {
                          new Tooltip(eventData.el, {
                            title: eventData.event.extendedProps.description,
                            placement: 'top',
                            trigger: 'hover',
                            container: 'body',
                          });
                        },
                        eventClick: function(eventData) {
                          that
                            .get('router')
                            .transitionTo(
                              'rendering.data.collection.list.viewEdit.details',
                              that.get('collection.id'),
                              eventData.event.id,
                            );
                        },
                      });

                      calendar.render();

                      that.set('loaded', true);
                    },
                  );
                },
              );
            },
          );
        });
      });

      const cssCoreLink = $('<link>');
      const cssDayGridLink = $('<link>');
      const cssTimegridLink = $('<link>');
      $('head').append(cssCoreLink);
      $('head').append(cssDayGridLink);
      $('head').append(cssTimegridLink);

      cssCoreLink.attr({
        rel: 'stylesheet',
        type: 'text/css',
        href: 'https://cdnjs.cloudflare.com/ajax/libs/fullcalendar/4.2.0/core/main.min.css',
      });
      cssDayGridLink.attr({
        rel: 'stylesheet',
        type: 'text/css',
        href: 'https://cdnjs.cloudflare.com/ajax/libs/fullcalendar/4.2.0/daygrid/main.min.css',
      });
      cssTimegridLink.attr({
        rel: 'stylesheet',
        type: 'text/css',
        href: 'https://cdnjs.cloudflare.com/ajax/libs/fullcalendar/4.2.0/timegrid/main.min.css',
      });
    });
  }.on('init'),
  setEvent: function() {
    if (!this.get('records')) {
      return;
    }

    this.get('records').forEach(function(deliverySlip) {
      const association = deliverySlip.get('forest-_associationId');
      const shop = deliverySlip.get('forest-_shopId');

      const event = {
        id: deliverySlip.get('id'),
        title: `${shop.get('forest-name')} -> ${association.get('forest-name')}`,
        description: `${shop.get('forest-name')} -> ${association.get('forest-name')}`,
        start: deliverySlip.get('forest-datetime'),
      };

      calendar.addEvent(event);
    });
  }.observes('loaded', 'records.[]'),
});
