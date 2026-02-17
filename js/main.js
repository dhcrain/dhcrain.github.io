(function($) {
  'use strict';

  function animateOnScroll() {
    $('.dc-animation').each(function() {
      var el = $(this);
      var top = el.offset().top;
      var bottom = $(window).scrollTop() + $(window).height();
      if (bottom > top + 50) {
        el.addClass('dc-animated');
      }
    });
  }

  $(window).on('scroll', animateOnScroll);

  $(document).ready(function() {
    animateOnScroll();

    // Magnific Popup for gallery
    if ($.fn.magnificPopup) {
      $('.dc-gallery-mfp').magnificPopup({
        delegate: '.dc-gallery-link',
        type: 'image',
        gallery: {
          enabled: true,
          navigateByImgClick: true
        },
        image: {
          titleSrc: function(item) {
            return item.el.find('img').attr('title') || '';
          }
        }
      });
    }

    // Smooth scroll for anchor links
    $('a[href^="#"]').on('click', function(e) {
      var target = $(this.getAttribute('href'));
      if (target.length) {
        e.preventDefault();
        $('html, body').animate({
          scrollTop: target.offset().top - 60
        }, 600);
      }
    });

    // Fixed header show/hide
    var fixedHeader = $('.dc-page-header-fixed');
    $(window).on('scroll', function() {
      if ($(this).scrollTop() > 200) {
        fixedHeader.addClass('dc-page-header-fixed-show');
      } else {
        fixedHeader.removeClass('dc-page-header-fixed-show');
      }
    });

    // Mobile menu toggle
    $('.dc-menu-mobile-toggle').on('click', function() {
      var menu = $(this).closest('.dc-menu').find('nav ul');
      menu.toggleClass('dc-menu-open');
    });
  });
})(jQuery);
