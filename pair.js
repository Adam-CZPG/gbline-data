// GBLiNE: hand a playlist from this phone to the TV that showed the QR code.
// The details go to the TV once (they are deleted when the TV takes them, or after 15 minutes).
(function () {
  var API = 'https://javwlswxwrahnkcfwgsd.supabase.co/rest/v1/rpc/gbline_tv_pair_submit';
  var KEY = 'sb_publishable_IZqG9pLjGUdHzjyMSEf9yg_5Es-nlZ-';
  var T = {
    en: { title: 'Add a playlist to your TV', for_tv: 'TV code:', m3u: 'M3U link', xtream: 'Xtream Codes', url: 'Playlist link', server: 'Server', username: 'Username', password: 'Password', name: 'Name (optional)', send: 'Send to TV', sent: 'Sent! Look at your TV — the channels are loading.', fail: 'Could not send. Check your internet and try again.', missing: 'Please fill in the fields.', expired: 'This code is not valid. Scan the QR code on the TV again.', note: 'GBLiNE does not provide playlists or channels. Add only playlists you have the right to watch.', nocode_title: 'Scan the code on your TV', nocode_desc: 'Open My channels → Add playlist on the GBLiNE TV app and scan the QR code shown there.' },
    uz: { title: "TV'ga playlist qo'shish", for_tv: 'TV kodi:', m3u: 'M3U havola', xtream: 'Xtream Codes', url: 'Playlist havolasi', server: 'Server', username: 'Login', password: 'Parol', name: 'Nomi (ixtiyoriy)', send: "TV'ga yuborish", sent: "Yuborildi! TV'ga qarang — kanallar yuklanmoqda.", fail: "Yuborib bo'lmadi. Internetni tekshirib, qayta urinib ko'ring.", missing: "Iltimos, maydonlarni to'ldiring.", expired: "Bu kod yaroqsiz. TV'dagi QR kodni qayta skanerlang.", note: "GBLiNE playlist yoki kanal bermaydi. Faqat ko'rishga huquqingiz bor playlistlarni qo'shing.", nocode_title: "TV'dagi kodni skanerlang", nocode_desc: "GBLiNE TV ilovasida Mening kanallarim → Playlist qo'shish ni oching va u yerdagi QR kodni skanerlang." },
    ru: { title: 'Добавить плейлист на телевизор', for_tv: 'Код ТВ:', m3u: 'Ссылка M3U', xtream: 'Xtream Codes', url: 'Ссылка на плейлист', server: 'Сервер', username: 'Логин', password: 'Пароль', name: 'Название (необязательно)', send: 'Отправить на ТВ', sent: 'Отправлено! Посмотрите на телевизор — каналы загружаются.', fail: 'Не удалось отправить. Проверьте интернет и попробуйте снова.', missing: 'Заполните поля.', expired: 'Код недействителен. Отсканируйте QR-код на телевизоре ещё раз.', note: 'GBLiNE не предоставляет плейлисты и каналы. Добавляйте только плейлисты, которые вы вправе смотреть.', nocode_title: 'Отсканируйте код на телевизоре', nocode_desc: 'Откройте в приложении GBLiNE TV «Мои каналы» → «Добавить плейлист» и отсканируйте QR-код.' },
    cs: { title: 'Přidat playlist do televize', for_tv: 'Kód TV:', m3u: 'Odkaz M3U', xtream: 'Xtream Codes', url: 'Odkaz na playlist', server: 'Server', username: 'Uživatelské jméno', password: 'Heslo', name: 'Název (nepovinné)', send: 'Odeslat do TV', sent: 'Odesláno! Podívejte se na televizi — kanály se načítají.', fail: 'Odeslání se nezdařilo. Zkontrolujte internet a zkuste to znovu.', missing: 'Vyplňte prosím pole.', expired: 'Kód není platný. Naskenujte QR kód v televizi znovu.', note: 'GBLiNE neposkytuje playlisty ani kanály. Přidávejte jen playlisty, které máte právo sledovat.', nocode_title: 'Naskenujte kód v televizi', nocode_desc: 'V aplikaci GBLiNE TV otevřete Moje kanály → Přidat playlist a naskenujte zobrazený QR kód.' },
    sk: { title: 'Pridať playlist do televízora', for_tv: 'Kód TV:', m3u: 'Odkaz M3U', xtream: 'Xtream Codes', url: 'Odkaz na playlist', server: 'Server', username: 'Používateľské meno', password: 'Heslo', name: 'Názov (nepovinné)', send: 'Odoslať do TV', sent: 'Odoslané! Pozrite sa na televízor — kanály sa načítavajú.', fail: 'Odoslanie zlyhalo. Skontrolujte internet a skúste to znova.', missing: 'Vyplňte prosím polia.', expired: 'Kód nie je platný. Naskenujte QR kód v televízore znova.', note: 'GBLiNE neposkytuje playlisty ani kanály. Pridávajte len playlisty, ktoré máte právo sledovať.', nocode_title: 'Naskenujte kód v televízore', nocode_desc: 'V aplikácii GBLiNE TV otvorte Moje kanály → Pridať playlist a naskenujte zobrazený QR kód.' },
    pl: { title: 'Dodaj playlistę do telewizora', for_tv: 'Kod TV:', m3u: 'Link M3U', xtream: 'Xtream Codes', url: 'Link do playlisty', server: 'Serwer', username: 'Nazwa użytkownika', password: 'Hasło', name: 'Nazwa (opcjonalnie)', send: 'Wyślij do TV', sent: 'Wysłano! Spójrz na telewizor — kanały się wczytują.', fail: 'Nie udało się wysłać. Sprawdź internet i spróbuj ponownie.', missing: 'Wypełnij pola.', expired: 'Kod jest nieważny. Zeskanuj ponownie kod QR z telewizora.', note: 'GBLiNE nie udostępnia playlist ani kanałów. Dodawaj tylko playlisty, do których oglądania masz prawo.', nocode_title: 'Zeskanuj kod z telewizora', nocode_desc: 'W aplikacji GBLiNE TV otwórz Moje kanały → Dodaj playlistę i zeskanuj wyświetlony kod QR.' },
    de: { title: 'Playlist zum Fernseher hinzufügen', for_tv: 'TV-Code:', m3u: 'M3U-Link', xtream: 'Xtream Codes', url: 'Playlist-Link', server: 'Server', username: 'Benutzername', password: 'Passwort', name: 'Name (optional)', send: 'An den Fernseher senden', sent: 'Gesendet! Schau auf den Fernseher — die Sender werden geladen.', fail: 'Senden fehlgeschlagen. Prüfe das Internet und versuche es erneut.', missing: 'Bitte die Felder ausfüllen.', expired: 'Dieser Code ist ungültig. Scanne den QR-Code am Fernseher erneut.', note: 'GBLiNE stellt keine Playlists oder Sender bereit. Füge nur Playlists hinzu, die du ansehen darfst.', nocode_title: 'Code am Fernseher scannen', nocode_desc: 'Öffne in der GBLiNE-TV-App Meine Sender → Playlist hinzufügen und scanne den QR-Code.' }
  };
  var params = new URLSearchParams(location.search);
  var lang = (params.get('l') || navigator.language || 'en').slice(0, 2).toLowerCase();
  var t = T[lang] || T.en;
  document.documentElement.lang = T[lang] ? lang : 'en';
  document.querySelectorAll('[data-t]').forEach(function (el) { el.textContent = t[el.getAttribute('data-t')] || ''; });

  var code = (params.get('c') || '').toUpperCase();
  if (!/^[A-HJ-NP-Z2-9]{10}$/.test(code)) {
    document.getElementById('nocode').hidden = false;
    return;
  }
  // The code works like a one-time password: keep it out of the browser history and any shared link.
  history.replaceState(null, '', location.pathname);
  var form = document.getElementById('form');
  form.hidden = false;
  document.getElementById('code').textContent = code;

  var mode = 'm3u';
  document.querySelectorAll('[data-mode]').forEach(function (button) {
    button.addEventListener('click', function () {
      mode = button.getAttribute('data-mode');
      document.querySelectorAll('[data-mode]').forEach(function (b) { b.setAttribute('aria-pressed', String(b === button)); });
      document.getElementById('m3u').hidden = mode !== 'm3u';
      document.getElementById('xtream').hidden = mode !== 'xtream';
    });
  });

  var msg = document.getElementById('msg');
  function show(text, ok) {
    msg.hidden = false;
    msg.className = 'msg ' + (ok ? 'ok' : 'err');
    msg.textContent = text;
  }
  var value = function (id) { return document.getElementById(id).value.trim(); };

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    var payload = mode === 'xtream'
      ? { type: 'xtream', server: value('server'), username: value('username'), password: document.getElementById('password').value, name: value('name') }
      : { type: 'm3u', url: value('url'), name: value('name') };
    var filled = mode === 'xtream' ? payload.server && payload.username && payload.password : payload.url;
    if (!filled) return show(t.missing, false);
    var button = form.querySelector('.submit');
    button.disabled = true;
    fetch(API, {
      method: 'POST',
      headers: { apikey: KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ p_code: code, p_payload: payload })
    })
      .then(function (response) { return response.ok ? response.json() : null; })
      .then(function (ok) {
        if (ok === true) {
          show(t.sent, true);
          document.getElementById('password').value = '';
        } else {
          show(ok === false ? t.expired : t.fail, false);
          button.disabled = false;
        }
      })
      .catch(function () {
        show(t.fail, false);
        button.disabled = false;
      });
  });
})();
