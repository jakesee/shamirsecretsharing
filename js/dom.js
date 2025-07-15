/*
 * dom.js - DOM utility functions for Shamir Secret Sharing app
 * Author: Jake See
 * License: GPL v3
 * https://www.gnu.org/licenses/gpl-3.0.html
 */

(function() {
    if (!window.$) {
        $.hide = function(el) {
            el = $(el);
            if (el) el.style.display = 'none';
        };
        $.show = function(el) {
            el = $(el);
            if (el) el.style.display = 'block';
        };
        function $(selector, context) {
            if (selector instanceof Element) return selector;
            return (context || document).querySelector(selector);
        }
        $.ready = function(fn) {
            if (document.readyState === 'complete' || document.readyState === 'interactive') {
                setTimeout(fn, 0);
            } else {
                document.addEventListener('DOMContentLoaded', fn);
            }
        };
        $.copyToClipboard = function(text, onSuccess, onError) {
            if (navigator.clipboard) {
                navigator.clipboard.writeText(text).then(() => {
                    if (typeof onSuccess === 'function') onSuccess();
                }).catch(err => {
                    if (typeof onError === 'function') onError(err);
                });
            } else {
                // fallback for older browsers
                const textarea = document.createElement('textarea');
                textarea.value = text;
                document.body.appendChild(textarea);
                textarea.select();
                try {
                    document.execCommand('copy');
                    if (typeof onSuccess === 'function') onSuccess();
                } catch (err) {
                    if (typeof onError === 'function') onError(err);
                }
                document.body.removeChild(textarea);
            }
        };
        $.click = function(selector, callback, context) {
            const el = $(selector, context);
            if (el) el.addEventListener('click', callback);
        };
        $.mouseover = function(selector, callback, context) {
            const el = $(selector, context);
            if (el) el.addEventListener('mouseover', callback);
        };
        window.$ = $;
    }
    if (!window.$$) {
        function $$(selector, context) {
            return Array.from((context || document).querySelectorAll(selector));
        }
        window.$$ = $$;
    }
})();
