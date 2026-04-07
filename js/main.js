(function($) {
  'use strict';

  function animateOnScroll() {
    $('.dhc-animation').each(function() {
      var el = $(this);
      var top = el.offset().top;
      var bottom = $(window).scrollTop() + $(window).height();
      if (bottom > top + 50) {
        el.addClass('dhc-animated');
      }
    });
  }

  $(window).on('scroll', animateOnScroll);

  $(document).ready(function() {
    animateOnScroll();

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
    var fixedHeader = $('.dhc-page-header-fixed');
    $(window).on('scroll', function() {
      if ($(this).scrollTop() > 200) {
        fixedHeader.addClass('dhc-page-header-fixed-show');
      } else {
        fixedHeader.removeClass('dhc-page-header-fixed-show');
      }
    });

    // Mobile menu toggle
    $('.dhc-menu-mobile-toggle').on('click', function() {
      var menu = $(this).closest('.dhc-menu').find('nav ul');
      menu.toggleClass('dhc-menu-open');
    });

    // Close mobile menu when a link is clicked
    $('.hero-nav-list a').on('click', function() {
      $('.hero-nav-list').removeClass('dhc-menu-open');
    });
  });
})(jQuery);
