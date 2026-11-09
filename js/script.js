$(function () {
  // Shared feedback for registration and playlist forms.
  function showFeedback(id, message) {
    const field = $('#' + id);
    field.toggleClass('is-invalid', Boolean(message));
    field.toggleClass('is-valid', !message);
    field.attr('aria-invalid', Boolean(message));
    $('#' + id + '-feedback').text(message);
    return !message;
  }

  // 1. Registration validation (demo only; no data is stored).
  if ($('#registration-form').length) {
    const fieldIds = ['name', 'email', 'password', 'confirm-password'];
    let submitted = false;

    function validateRegistrationField(id) {
      const value = $('#' + id).val();
      let message = '';
      if (!value.trim()) {
        message = 'This field is required.';
      } else if (id === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
        message = 'Enter a valid email, for example fan@example.com.';
      } else if (id === 'password' && value.length < 8) {
        message = 'Use at least 8 characters.';
      } else if (id === 'confirm-password' && value !== $('#password').val()) {
        message = 'Passwords must match.';
      }
      return showFeedback(id, message);
    }

    function updateStrength() {
      const password = $('#password').val();
      const indicator = $('#password-strength');
      indicator.removeClass('strength-weak strength-medium strength-strong');
      if (!password.trim()) {
        indicator.text('Strength: enter a password');
        return;
      }
      let strength = 'Weak';
      if (password.length >= 8) {
        strength = 'Medium';
        if (/[a-z]/.test(password) && /[A-Z]/.test(password) && /\d/.test(password) && /[^A-Za-z0-9\s]/.test(password)) {
          strength = 'Strong';
        }
      }
      indicator.addClass('strength-' + strength.toLowerCase()).text('Strength: ' + strength);
    }

    $('#registration-form input').on('input change', function () {
      $('#registration-status').empty().removeClass('alert alert-success alert-danger');
      validateRegistrationField(this.id);
      if (this.id === 'password') {
        updateStrength();
        if ($('#confirm-password').val() || submitted) {
          validateRegistrationField('confirm-password');
        }
      }
    });

    $('#registration-form').on('submit', function (event) {
      event.preventDefault();
      submitted = true;
      // Validate every field, even if an earlier field is invalid.
      const results = fieldIds.map(validateRegistrationField);
      updateStrength();
      const valid = results.every(Boolean);
      $('#registration-status')
        .removeClass('alert-success alert-danger').addClass('alert')
        .addClass(valid ? 'alert-success' : 'alert-danger')
        .text(valid
          ? 'Validation successful! This is a demo: no account was created and no data was saved.'
          : 'Please correct the highlighted fields.');
      if (!valid) {
        $('#registration-form .is-invalid').first().trigger('focus');
      } else {
        // Do not keep demo passwords after successful validation.
        $('#password, #confirm-password').val('').removeClass('is-valid').removeAttr('aria-invalid');
        submitted = false;
        updateStrength();
      }
    });
  }

  // 2. Search, category filtering and CRUD share the same song array.
  if ($('#song-rows').length) {
    let songs = [
      { id: 1, title: 'Don’t Look Back in Anger', album: "(What's the Story) Morning Glory?" },
      { id: 2, title: 'Cast No Shadow', album: "(What's the Story) Morning Glory?" },
      { id: 3, title: 'Stand By Me', album: 'Be Here Now' },
      { id: 4, title: 'The Girl in the Dirty Shirt', album: 'Be Here Now' },
      { id: 5, title: "Don't Go Away", album: 'Be Here Now' },
      { id: 6, title: 'Live Forever', album: 'Definitely Maybe' },
      { id: 7, title: 'Supersonic', album: 'Definitely Maybe' }
    ];
    let nextId = 8;
    let editingId = null;
    let category = 'all';
    let deletingId = null;
    const deleteDialog = $('#delete-dialog')[0];

    function renderSongs() {
      const query = $('#song-search').val().trim().toLowerCase();
      const visibleSongs = songs.filter(function (song) {
        const matchesSearch = (song.title + ' ' + song.album).toLowerCase().includes(query);
        const matchesCategory = category === 'all' || song.album.toLowerCase() === category.toLowerCase();
        return matchesSearch && matchesCategory;
      });
      const body = $('#song-rows').empty();
      visibleSongs.forEach(function (song) {
        const row = $('<tr>');
        // .text() prevents user-entered titles from becoming executable HTML.
        $('<td>').text(song.id).appendTo(row);
        $('<td>').text(song.title).appendTo(row);
        $('<td>').text(song.album).appendTo(row);
        const actions = $('<div>').addClass('song-actions');
        $('<button>').attr({ type: 'button', 'data-id': song.id, 'aria-label': 'Edit ' + song.title })
          .addClass('btn btn-sm btn-outline-secondary edit-song').text('Edit').appendTo(actions);
        $('<button>').attr({ type: 'button', 'data-id': song.id, 'aria-label': 'Delete ' + song.title })
          .addClass('btn btn-sm btn-outline-danger delete-song').text('Delete').appendTo(actions);
        $('<td>').append(actions).appendTo(row);
        body.append(row);
      });
      if (!visibleSongs.length) {
        const message = songs.length ? 'No results found.' : 'Your playlist is empty. Add a song below.';
        body.append($('<tr>').append($('<td>').attr('colspan', 4).addClass('text-center').text(message)));
      }
      $('#song-count').text(visibleSongs.length + ' of ' + songs.length + ' songs shown');
    }

    function resetSongForm() {
      editingId = null;
      $('#song-form')[0].reset();
      $('#song-form .form-control, #song-form .form-select').removeClass('is-valid is-invalid').removeAttr('aria-invalid');
      $('#song-form .invalid-feedback').empty();
      $('#song-form-title').text('Add a song');
      $('#save-song').text('Add song');
      $('#cancel-edit').prop('hidden', true);
    }

    function validateSongField(id) {
      return showFeedback(id, $('#' + id).val().trim() ? '' : 'This field is required.');
    }

    $('#song-search').on('input', renderSongs);
    $('#category-filters button').on('click', function () {
      category = $(this).attr('data-category');
      $('#category-filters button').removeClass('active').attr('aria-pressed', 'false');
      $(this).addClass('active').attr('aria-pressed', 'true');
      renderSongs();
    });
    $('#song-title, #song-album').on('input change', function () {
      validateSongField(this.id);
    });

    $('#song-form').on('submit', function (event) {
      event.preventDefault();
      const titleValid = validateSongField('song-title');
      const albumValid = validateSongField('song-album');
      if (!titleValid || !albumValid) {
        $('#song-form .is-invalid').first().trigger('focus');
        return;
      }
      const title = $('#song-title').val().trim();
      const album = $('#song-album').val();
      if (editingId === null) {
        songs.push({ id: nextId++, title: title, album: album });
        $('#song-status').text('Song added. Current search and category filters still apply.');
      } else {
        const song = songs.find(function (item) { return item.id === editingId; });
        song.title = title;
        song.album = album;
        $('#song-status').text('Song updated. Current search and category filters still apply.');
      }
      resetSongForm();
      renderSongs();
    });

    $('#song-rows').on('click', '.edit-song', function () {
      const id = Number($(this).attr('data-id'));
      const song = songs.find(function (item) { return item.id === id; });
      resetSongForm();
      editingId = id;
      $('#song-title').val(song.title);
      $('#song-album').val(song.album);
      $('#song-form-title').text('Edit song #' + id);
      $('#save-song').text('Save changes');
      $('#cancel-edit').prop('hidden', false);
      $('#song-status').empty();
      $('#song-title').trigger('focus');
    });

    $('#cancel-edit').on('click', function () {
      resetSongForm();
      $('#song-status').text('Editing cancelled. The song was not changed.');
    });

    $('#song-rows').on('click', '.delete-song', function () {
      const id = Number($(this).attr('data-id'));
      const song = songs.find(function (item) { return item.id === id; });
      deletingId = id;
      $('#delete-question').text('Remove "' + song.title + '" from the playlist?');
      deleteDialog.returnValue = 'cancel';
      deleteDialog.showModal();
    });

    $('#delete-dialog').on('close', function () {
      if (deleteDialog.returnValue !== 'delete') {
        $('#song-status').text('Deletion cancelled. The song was not removed.');
        deletingId = null;
        return;
      }
      songs = songs.filter(function (item) { return item.id !== deletingId; });
      if (editingId === deletingId) resetSongForm();
      deletingId = null;
      renderSongs();
      $('#song-status').text('Song deleted.');
      $('#song-title').trigger('focus');
    });
    renderSongs();
  }

  // 3. Album lightbox with jQuery fade effects and cyclic navigation.
  if ($('#lightbox').length && $('.gallery-item').length) {
    const galleryButtons = $('.gallery-item');
    const lightbox = $('#lightbox');
    let currentImage = 0;
    let previousFocus = null;
    let isOpen = false;

    function showImage(index) {
      currentImage = (index + galleryButtons.length) % galleryButtons.length;
      const source = galleryButtons.eq(currentImage).find('img');
      $('#lightbox-image').attr({ src: source.attr('src'), alt: source.attr('alt') });
      $('#lightbox-caption').text(source.attr('alt') + ' — ' + (currentImage + 1) + ' / ' + galleryButtons.length);
    }

    function closeLightbox() {
      if (!isOpen) return;
      isOpen = false;
      lightbox.stop(true, true).fadeOut(200, function () {
        $('body').removeClass('gallery-open');
        $('.header, .main, .footer').prop('inert', false);
        if (previousFocus) previousFocus.focus();
      });
    }

    galleryButtons.on('click', function () {
      previousFocus = this;
      showImage(galleryButtons.index(this));
      isOpen = true;
      $('body').addClass('gallery-open');
      $('.header, .main, .footer').prop('inert', true);
      lightbox.stop(true, true).fadeIn(200);
      $('#lightbox-close').trigger('focus');
    });
    $('#lightbox-close').on('click', closeLightbox);
    $('#lightbox-prev').on('click', function () { showImage(currentImage - 1); });
    $('#lightbox-next').on('click', function () { showImage(currentImage + 1); });
    lightbox.on('click', function (event) {
      if (event.target === this) closeLightbox();
    });
    $(document).on('keydown', function (event) {
      if (!isOpen) return;
      if (event.key === 'Escape') closeLightbox();
      if (event.key === 'ArrowLeft') { event.preventDefault(); showImage(currentImage - 1); }
      if (event.key === 'ArrowRight') { event.preventDefault(); showImage(currentImage + 1); }
      // Keep keyboard focus in the open dialog.
      if (event.key === 'Tab') {
        const buttons = lightbox.find('button');
        const first = buttons[0];
        const last = buttons[buttons.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault(); last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault(); first.focus();
        }
      }
    });
  }
});
