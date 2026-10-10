(function () {
  'use strict';
  var scope = 'gmath.presentation.v1';
  var session = '';
  var parentOrigin = '';
  var controller = null;
  var count = 0;
  var failure = '';

  function send(payload) {
    if (!session || !parentOrigin) return;
    window.parent.postMessage(Object.assign({ scope: scope, session: session }, payload), parentOrigin);
  }

  function reportError(error) {
    failure = error instanceof Error ? error.message : 'Presentation navigation failed';
    send({ kind: 'error', message: failure.slice(0, 500) });
  }

  function report() {
    if (failure) {
      send({ kind: 'error', message: failure });
    } else if (controller) {
      send({
        kind: 'state',
        count: count,
        index: controller.currentSlideIndex(),
        previous: controller.previousSlideIndex() >= 0,
        next: controller.nextSlideIndex() >= 0,
      });
    } else {
      send({ kind: 'native' });
    }
  }

  window.gmathPresentationBridge = {
    register: function (player) {
      try {
        if (typeof player.view !== 'function' || typeof player.presentation !== 'function') {
          throw new Error('This export does not expose a compatible presentation API');
        }
        var playback = player.view().playbackController();
        var total = player.presentation().slides().count();
        if (!Number.isSafeInteger(total) || total < 1 || total > 2000) {
          throw new Error('The presentation returned an invalid page count');
        }
        controller = playback;
        count = total;
        controller.slideChangeEvent().addHandler(report);
        if (typeof controller.navigationRestrictedEvent === 'function') {
          controller.navigationRestrictedEvent().addHandler(function () {
            reportError(new Error('The presentation restricts navigation to this page'));
          });
        }
        if (controller.currentSlideIndex() < 0) controller.gotoFirstSlide();
        report();
      } catch (error) {
        reportError(error);
      }
    },
  };

  window.addEventListener('message', function (event) {
    var data = event.data;
    if (
      event.source !== window.parent || !data || data.scope !== scope ||
      typeof data.session !== 'string' || data.session.length < 16 ||
      data.session.length > 100 || !/^https?:\/\//.test(event.origin)
    ) return;
    if (data.kind === 'init') {
      if (parentOrigin && parentOrigin !== event.origin) return;
      session = data.session;
      parentOrigin = event.origin;
      report();
      return;
    }
    if (data.session !== session || event.origin !== parentOrigin || data.kind !== 'command') return;
    try {
      if (!controller) throw new Error('Presentation navigation is not ready');
      failure = '';
      if (data.action === 'next') {
        if (controller.nextSlideIndex() < 0) throw new Error('There is no next page');
        controller.gotoNextSlide();
      } else if (data.action === 'previous') {
        if (controller.previousSlideIndex() < 0) throw new Error('There is no previous page');
        controller.gotoPreviousSlide();
      } else if (data.action === 'goto') {
        if (!Number.isInteger(data.index) || data.index < 0 || data.index >= count) {
          throw new Error('The requested page is outside the presentation');
        }
        controller.gotoSlide(data.index);
      } else {
        throw new Error('Unknown presentation navigation command');
      }
      report();
    } catch (error) {
      reportError(error);
    }
  });
})();
