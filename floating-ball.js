/**
 * Roche 悬浮球插件 v2.3.0
 * 
 * 功能：
 * 1. 悬浮球全局可用（不随插件页面切换消失）
 * 2. 注入用户消息 / 角色消息 / 系统消息
 * 3. 触发AI原生回复（DOM自动发送，走Roche完整流程）
 * 4. 跳转会话
 * 5. 记忆读写
 * 
 * 基于 RocheToolkit 逆向的 IndexedDB 结构
 */

window.RochePlugin.register({
  id: "floating-ball",
  name: "悬浮球",
  version: "2.3.0",
  apps: [
    {
      id: "floating-ball-main",
      name: "悬浮球",
      icon: "bubble_chart",
      iconImage: "",
      async mount(container, roche) {
        var style = document.createElement('style');
        style.id = 'roche-plugin-floating-ball-style';
        style.textContent = `
          .roche-plugin-floating-ball {
            --bg: #0a0a0f; --card: #141420; --accent: #e94560; --blue: #0f3460;
            --text: #e0e0e0; --text2: #888; --radius: 12px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            color: var(--text); background: var(--bg); padding: 20px;
            height: 100%; overflow-y: auto; box-sizing: border-box;
          }
          .roche-plugin-floating-ball h2 { margin: 0 0 16px 0; font-size: 20px; color: var(--accent); }
          .roche-plugin-floating-ball .section { background: var(--card); border-radius: var(--radius); padding: 16px; margin-bottom: 12px; }
          .roche-plugin-floating-ball .section-title { font-size: 14px; color: var(--text2); margin-bottom: 10px; text-transform: uppercase; letter-spacing: 1px; }
          .roche-plugin-floating-ball label { display: block; font-size: 13px; color: var(--text2); margin-bottom: 4px; }
          .roche-plugin-floating-ball select, .roche-plugin-floating-ball input, .roche-plugin-floating-ball textarea {
            width: 100%; background: #1a1a2e; border: 1px solid #2a2a3e; border-radius: 8px;
            color: var(--text); padding: 8px 12px; font-size: 14px; margin-bottom: 10px; box-sizing: border-box;
          }
          .roche-plugin-floating-ball textarea { min-height: 60px; resize: vertical; }
          .roche-plugin-floating-ball .btn {
            display: inline-block; padding: 8px 16px; border-radius: 8px; border: none;
            font-size: 14px; cursor: pointer; margin-right: 6px; margin-bottom: 6px;
          }
          .roche-plugin-floating-ball .btn-primary { background: var(--accent); color: #fff; }
          .roche-plugin-floating-ball .btn-secondary { background: var(--blue); color: #fff; }
          .roche-plugin-floating-ball .btn-green { background: #1a6a3a; color: #fff; }
          .roche-plugin-floating-ball .btn-orange { background: #a85a1a; color: #fff; }
          .roche-plugin-floating-ball .btn:disabled { opacity: 0.4; cursor: not-allowed; }
          .roche-plugin-floating-ball .status { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 12px; }
          .roche-plugin-floating-ball .status-on { background: #1a4a2e; color: #4ade80; }
          .roche-plugin-floating-ball .status-off { background: #3a1a1a; color: #f87171; }
          .roche-plugin-floating-ball .char-list-item {
            display: flex; align-items: center; padding: 8px; border-radius: 8px; cursor: pointer; margin-bottom: 4px;
          }
          .roche-plugin-floating-ball .char-list-item:hover { background: #1a1a2e; }
          .roche-plugin-floating-ball .char-list-item.selected { background: var(--blue); }
          .roche-plugin-floating-ball .char-avatar { width: 32px; height: 32px; border-radius: 50%; margin-right: 10px; object-fit: cover; }
          .roche-plugin-floating-ball .char-name { font-size: 14px; }
          .roche-plugin-floating-ball .divider { border-top: 1px solid #2a2a3e; margin: 12px 0; }
          /* 悬浮球 - 全局 */
          #fb-global-ball {
            position: fixed; width: 48px; height: 48px; border-radius: 50%;
            background: #e94560; color: #fff; display: flex; align-items: center; justify-content: center;
            font-size: 20px; cursor: pointer; z-index: 99999;
            box-shadow: 0 2px 12px rgba(233,69,96,0.4); user-select: none; transition: transform 0.2s;
          }
          #fb-global-ball:hover { transform: scale(1.1); }
          /* 聊天面板 - 全局 */
          #fb-global-chat {
            position: fixed; width: 320px; max-height: 440px; background: #141420;
            border-radius: 12px; box-shadow: 0 4px 24px rgba(0,0,0,0.6); z-index: 99998;
            display: flex; flex-direction: column; overflow: hidden;
          }
          #fb-global-chat .chat-header { padding: 10px 14px; background: #1a1a2e; display: flex; align-items: center; justify-content: space-between; }
          #fb-global-chat .chat-body { flex: 1; overflow-y: auto; padding: 10px; max-height: 300px; }
          #fb-global-chat .chat-footer { padding: 8px; display: flex; gap: 6px; background: #1a1a2e; flex-wrap: wrap; }
          #fb-global-chat .chat-footer input { flex: 1; min-width: 120px; margin: 0; background: #1a1a2e; border: 1px solid #2a2a3e; border-radius: 8px; color: #e0e0e0; padding: 8px 12px; font-size: 14px; }
          #fb-global-chat .chat-footer .fb-btn { padding: 6px 12px; border-radius: 8px; border: none; cursor: pointer; font-size: 13px; color: #fff; }
          #fb-global-chat .fb-btn-send { background: #e94560; }
          #fb-global-chat .fb-btn-native { background: #1a6a3a; }
          #fb-global-chat .fb-btn-inject { background: #0f3460; }
          .fb-bubble { padding: 8px 12px; border-radius: 12px; margin-bottom: 6px; font-size: 13px; max-width: 85%; word-break: break-word; }
          .fb-bubble-char { background: #16213e; }
          .fb-bubble-user { background: #0f3460; margin-left: auto; }
          .fb-bubble-system { background: #2a1a3a; color: #c0a0e0; font-style: italic; margin: 0 auto; text-align: center; max-width: 95%; }
          .fb-bubble-waiting { background: #1a1a2e; color: #888; font-style: italic; margin: 0 auto; text-align: center; max-width: 95%; }
        `;
        document.head.appendChild(style);

        // ========== 全局状态（存在window上，不随unmount丢失） ==========
        if (!window.__fbState) {
          window.__fbState = {
            selectedCharId: null,
            selectedChar: null,
            conversationId: null,
            ballVisible: false,
            chatOpen: false,
            chatMessages: [],
            db: null,
            initialized: false
          };
        }
        var state = window.__fbState;

        // ========== IndexedDB 操作 ==========
        var DB_NAME = 'Roche_db';

        function openDB() {
          return new Promise(function(resolve, reject) {
            if (state.db) { resolve(state.db); return; }
            var req = indexedDB.open(DB_NAME);
            req.onsuccess = function() { state.db = req.result; resolve(state.db); };
            req.onerror = function() { reject(req.error); };
          });
        }

        function addRecord(storeName, record) {
          return openDB().then(function(d) {
            return new Promise(function(resolve, reject) {
              var tx = d.transaction(storeName, 'readwrite');
              var store = tx.objectStore(storeName);
              var req = store.add(record);
              req.onsuccess = function() { resolve(req.result); };
              req.onerror = function() { reject(req.error); };
            });
          });
        }

        function injectUserMessage(convId, text) {
          var now = Date.now();
          var msg = {
            id: now + Math.floor(Math.random() * 1000), isMe: true, text: text, type: 'text',
            timestamp: now, conversationId: convId, sendFailed: false, isGenerating: false, isStreaming: false
          };
          return addRecord('messages', msg).then(function(id) {
            window.dispatchEvent(new CustomEvent('roche-data-changed', { detail: { source: 'floating-ball' } }));
            return id;
          });
        }

        function injectCharMessage(convId, text, senderName, senderId) {
          var now = Date.now();
          var msg = {
            id: now + Math.floor(Math.random() * 1000), isMe: false, text: text, type: 'text',
            timestamp: now, conversationId: convId, senderId: senderId || '', senderName: senderName || 'Char',
            isGenerating: false, isStreaming: false, sendFailed: false
          };
          return addRecord('messages', msg).then(function(id) {
            window.dispatchEvent(new CustomEvent('roche-data-changed', { detail: { source: 'floating-ball' } }));
            return id;
          });
        }

        function injectSystemNotice(convId, text, kind) {
          var now = Date.now();
          var msg = {
            id: now + Math.floor(Math.random() * 1000), isMe: false, text: text, type: 'system_notice',
            timestamp: now, conversationId: convId, systemNoticeKind: kind || 'info',
            senderName: 'System', senderId: '__system__',
            isGenerating: false, isStreaming: false, sendFailed: false
          };
          return addRecord('messages', msg).then(function(id) {
            window.dispatchEvent(new CustomEvent('roche-data-changed', { detail: { source: 'floating-ball' } }));
            return id;
          });
        }

        // ========== 触发AI原生回复（核心功能） ==========
        // 流程：关闭插件App → 导航到会话 → 等待加载 → 找到输入框 → 输入文字 → 点击发送
        // 这样走的是Roche完整流程：persona + memory + worldbook + AI回复

        function navigateToConversation(convId) {
          // 关闭插件App，回到主界面
          roche.ui.closeApp();

          // 等主界面恢复后，尝试多种导航方式
          setTimeout(function() {
            // 方法1：尝试Vue Router（如果Roche暴露了路由实例）
            try {
              var app = document.querySelector('#app');
              if (app && app.__vue_app__) {
                var router = app.__vue_app__.config.globalProperties.$router;
                if (router) {
                  router.push('/chat/' + convId);
                  return;
                }
              }
            } catch(e) {}

            // 方法2：在会话列表中找到目标会话并点击
            tryClickConversation(convId);
          }, 500);
        }

        function tryClickConversation(convId, retryCount) {
          retryCount = retryCount || 0;
          // 查找会话列表项
          var items = document.querySelectorAll('.conversation-item');
          if (items.length === 0 && retryCount < 10) {
            // 列表还没加载，等一下重试
            setTimeout(function() { tryClickConversation(convId, retryCount + 1); }, 300);
            return;
          }
          // 遍历找到目标会话（通过data属性或内部链接）
          for (var i = 0; i < items.length; i++) {
            var item = items[i];
            if (item.getAttribute('data-conversation-id') === convId ||
                item.getAttribute('data-id') === convId ||
                item.getAttribute('data-key') === convId) {
              item.click();
              return;
            }
          }
          // 没找到精确匹配，尝试通过内部链接匹配
          var links = document.querySelectorAll('.conversation-item a[href*="' + convId + '"]');
          if (links.length > 0) { links[0].click(); return; }

          // 兜底：重试或提示
          if (retryCount < 10) {
            setTimeout(function() { tryClickConversation(convId, retryCount + 1); }, 300);
          } else {
            roche.ui.toast('无法自动跳转，请手动打开会话');
          }
        }

        function triggerNativeReply(convId, text) {
          return new Promise(function(resolve, reject) {
            // 第1步：关闭插件App并导航到会话
            navigateToConversation(convId);

            // 第2步：等待聊天页面加载，然后找到输入框并发送
            var attempts = 0;
            var maxAttempts = 30; // 最多等6秒

            function trySend() {
              attempts++;
              var input = findChatInput();
              if (input) {
                typeAndSend(input, text);
                resolve({ success: true, method: 'native' });
                return;
              }
              if (attempts < maxAttempts) {
                setTimeout(trySend, 200);
              } else {
                reject(new Error('找不到聊天输入框。请手动打开会话后重试，或检查会话ID是否正确'));
              }
            }

            setTimeout(trySend, 800);
          });
        }

        function findChatInput() {
          // 优先使用Roche稳定钩子，再兜底模糊选择器
          var selectors = [
            '.chat-input-textarea',
            'textarea.chat-input-textarea',
            '.chat-input-field textarea',
            'textarea[class*="input"]',
            'textarea[class*="chat"]',
            'textarea[class*="compose"]',
            'textarea[placeholder]',
            '[contenteditable="true"]',
            'textarea',
            'input[type="text"][class*="chat"]',
            'input[type="text"][class*="input"]'
          ];
          for (var i = 0; i < selectors.length; i++) {
            var el = document.querySelector(selectors[i]);
            if (el && el.offsetParent !== null) return el;
          }
          return null;
        }

        function findSendButton() {
          // 优先使用Roche稳定钩子
          var selectors = [
            '.chat-input-send-button',
            '.chat-input-send',
            'button.chat-input-send',
            'button.chat-input-send-button',
            '.chat-input-send-icon',
            'button[class*="send"]',
            'button[class*="submit"]',
            '[class*="send-icon"]',
            '[class*="send-btn"]',
            'button[aria-label*="send"]',
            'button[aria-label*="发送"]'
          ];
          for (var i = 0; i < selectors.length; i++) {
            var el = document.querySelector(selectors[i]);
            if (el && el.offsetParent !== null) return el;
          }
          return null;
        }

        function typeAndSend(input, text) {
          input.focus();

          if (input.tagName === 'TEXTAREA' || input.type === 'text') {
            // 用原生setter设值，触发Vue响应式
            var setter = Object.getOwnPropertyDescriptor(
              window.HTMLTextAreaElement.prototype, 'value'
            ) || Object.getOwnPropertyDescriptor(
              window.HTMLInputElement.prototype, 'value'
            );
            if (setter) setter.call(input, text);
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));
          } else {
            // contenteditable div
            input.innerText = text;
            input.dispatchEvent(new Event('input', { bubbles: true }));
          }

          // 等一下让UI响应，然后点发送
          setTimeout(function() {
            var sendBtn = findSendButton();
            if (sendBtn) {
              sendBtn.click();
            } else {
              // 没找到发送按钮，按Enter
              input.dispatchEvent(new KeyboardEvent('keydown', {
                key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true
              }));
            }
          }, 300);
        }

        // ========== 悬浮球 DOM（全局，不随插件unmount消失） ==========

        function ensureBall() {
          if (document.getElementById('fb-global-ball')) return;
          var ball = document.createElement('div');
          ball.id = 'fb-global-ball';
          ball.textContent = '💬';

          var ballX = parseInt(localStorage.getItem('fb-ball-x')) || (window.innerWidth - 70);
          var ballY = parseInt(localStorage.getItem('fb-ball-y')) || Math.floor(window.innerHeight / 2);
          ball.style.left = ballX + 'px';
          ball.style.top = ballY + 'px';

          // 拖拽 + 点击
          var isDragging = false, startX, startY, startLeft, startTop;

          function onDown(x, y) {
            isDragging = false; startX = x; startY = y; startLeft = ballX; startTop = ballY;
          }
          function onMove(x, y) {
            var dx = x - startX, dy = y - startY;
            if (Math.abs(dx) > 5 || Math.abs(dy) > 5) isDragging = true;
            ballX = startLeft + dx; ballY = startTop + dy;
            ball.style.left = ballX + 'px'; ball.style.top = ballY + 'px';
          }
          function onUp() {
            if (ballX < window.innerWidth / 2) ballX = 10; else ballX = window.innerWidth - 58;
            ball.style.left = ballX + 'px';
            localStorage.setItem('fb-ball-x', ballX);
            localStorage.setItem('fb-ball-y', ballY);
            if (!isDragging) toggleChat();
          }

          ball.addEventListener('mousedown', function(e) {
            e.preventDefault();
            onDown(e.clientX, e.clientY);
            function m(e2) { onMove(e2.clientX, e2.clientY); }
            function u() { document.removeEventListener('mousemove', m); document.removeEventListener('mouseup', u); onUp(); }
            document.addEventListener('mousemove', m);
            document.addEventListener('mouseup', u);
          });

          ball.addEventListener('touchstart', function(e) {
            var t = e.touches[0]; onDown(t.clientX, t.clientY);
            function m(e2) { var t2 = e2.touches[0]; onMove(t2.clientX, t2.clientY); }
            function u() { document.removeEventListener('touchmove', m); document.removeEventListener('touchend', u); onUp(); }
            document.addEventListener('touchmove', m);
            document.addEventListener('touchend', u);
          });

          document.body.appendChild(ball);
          state.ballVisible = true;
        }

        function removeBall() {
          var ball = document.getElementById('fb-global-ball');
          if (ball) ball.remove();
          removeChat();
          state.ballVisible = false;
        }

        function toggleChat() {
          if (document.getElementById('fb-global-chat')) removeChat();
          else showChat();
        }

        function showChat() {
          if (document.getElementById('fb-global-chat')) return;
          if (!state.selectedChar) {
            // 没选角色，跳转到插件设置页
            roche.ui.openApp('floating-ball-main');
            return;
          }

          var panel = document.createElement('div');
          panel.id = 'fb-global-chat';
          panel.style.right = '10px';
          panel.style.bottom = '70px';
          var cn = state.selectedChar.handle || state.selectedChar.name || 'Char';
          panel.innerHTML =
            '<div class="chat-header">' +
              '<span style="font-size:14px;font-weight:bold;color:#e0e0e0;">' + cn + '</span>' +
              '<span style="cursor:pointer;font-size:18px;color:#888;" id="fb-chat-close">\u2715</span>' +
            '</div>' +
            '<div class="chat-body" id="fb-chat-body"></div>' +
            '<div class="chat-footer">' +
              '<input type="text" id="fb-chat-input" placeholder="\u8f93\u5165\u6d88\u606f...">' +
              '<button class="fb-btn fb-btn-send" id="fb-chat-send" title="\u6ce8\u5165\u7528\u6237\u6d88\u606f">\u6ce8\u5165</button>' +
              '<button class="fb-btn fb-btn-native" id="fb-chat-native" title="\u89e6\u53d1AI\u539f\u751f\u56de\u590d\uff08\u8d70Roche\u5b8c\u6574\u6d41\u7a0b\uff09">AI\u56de\u590d</button>' +
            '</div>';
          document.body.appendChild(panel);

          panel.querySelector('#fb-chat-close').onclick = removeChat;
          panel.querySelector('#fb-chat-send').onclick = function() { sendChatMessage('inject'); };
          panel.querySelector('#fb-chat-native').onclick = function() { sendChatMessage('native'); };
          panel.querySelector('#fb-chat-input').onkeydown = function(e) {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChatMessage('native'); }
          };
          renderChatMessages();
        }

        function removeChat() {
          var panel = document.getElementById('fb-global-chat');
          if (panel) panel.remove();
        }

        function renderChatMessages() {
          var body = document.getElementById('fb-chat-body');
          if (!body) return;
          body.innerHTML = '';
          state.chatMessages.forEach(function(m) {
            var b = document.createElement('div');
            if (m.type === 'system') b.className = 'fb-bubble fb-bubble-system';
            else if (m.type === 'waiting') b.className = 'fb-bubble fb-bubble-waiting';
            else b.className = 'fb-bubble ' + (m.isMe ? 'fb-bubble-user' : 'fb-bubble-char');
            b.textContent = m.text;
            body.appendChild(b);
          });
          body.scrollTop = body.scrollHeight;
        }

        function sendChatMessage(mode) {
          var input = document.getElementById('fb-chat-input');
          if (!input) return;
          var text = input.value.trim();
          if (!text || !state.conversationId) return;
          input.value = '';

          if (mode === 'native') {
            // 模式1：触发AI原生回复
            state.chatMessages.push({ isMe: true, text: text });
            state.chatMessages.push({ type: 'waiting', text: '\u23f3 \u5df2\u53d1\u9001\uff0c\u7b49\u5f85AI\u56de\u590d...' });
            renderChatMessages();

            triggerNativeReply(state.conversationId, text).then(function() {
              state.chatMessages = state.chatMessages.filter(function(m) { return m.type !== 'waiting'; });
              state.chatMessages.push({ isMe: false, text: '\u2705 \u5df2\u89e6\u53d1AI\u56de\u590d\uff0c\u8bf7\u5728\u804a\u5929\u754c\u9762\u67e5\u770b' });
              renderChatMessages();
            }).catch(function(err) {
              state.chatMessages = state.chatMessages.filter(function(m) { return m.type !== 'waiting'; });
              state.chatMessages.push({ type: 'system', text: '\u274c ' + err.message });
              renderChatMessages();
            });
          } else {
            // 模式2：仅注入消息（不触发AI）
            state.chatMessages.push({ isMe: true, text: text });
            renderChatMessages();
            injectUserMessage(state.conversationId, text).then(function() {
              roche.ui.toast('\u7528\u6237\u6d88\u606f\u5df2\u6ce8\u5165');
            });
          }
        }

        // ========== 渲染设置界面 ==========
        container.innerHTML = '<div class="roche-plugin-floating-ball"></div>';
        var root = container.querySelector('.roche-plugin-floating-ball');

        function render() {
          root.innerHTML = '';
          var h2 = document.createElement('h2'); h2.textContent = '\u60ac\u6d6e\u7403 v2.3'; root.appendChild(h2);

          // --- 关闭App按钮 ---
          var closeBtn = document.createElement('button');
          closeBtn.className = 'btn btn-secondary';
          closeBtn.textContent = '\u2715 \u5173\u95ed\u63d2\u4ef6';
          closeBtn.style.cssText = 'margin-bottom:12px;width:100%;';
          closeBtn.onclick = function() { roche.ui.closeApp(); };
          root.appendChild(closeBtn);

          // --- 选择角色 ---
          var charSection = document.createElement('div'); charSection.className = 'section';
          charSection.innerHTML = '<div class="section-title">\u9009\u62e9\u89d2\u8272</div><div id="fb-char-list">\u52a0\u8f7d\u4e2d...</div>';
          root.appendChild(charSection);
          roche.character.list().then(function(chars) {
            var listEl = charSection.querySelector('#fb-char-list');
            if (!chars || chars.length === 0) { listEl.textContent = '\u6682\u65e0\u89d2\u8272'; return; }
            listEl.innerHTML = '';
            chars.forEach(function(c) {
              var item = document.createElement('div');
              item.className = 'char-list-item' + (state.selectedCharId === c.id ? ' selected' : '');
              var dn = c.handle || c.name || 'Unknown';
              item.innerHTML = (c.avatar ? '<img class="char-avatar" src="' + c.avatar + '">' :
                '<div class="char-avatar" style="background:#2a2a3e;display:flex;align-items:center;justify-content:center;font-size:14px;">' + dn.charAt(0) + '</div>') +
                '<span class="char-name">' + dn + '</span>';
              item.onclick = function() {
                state.selectedCharId = c.id; state.selectedChar = c; state.conversationId = c.conversationId;
                roche.storage.set('selectedCharId', c.id); render();
              };
              listEl.appendChild(item);
            });
          });

          // --- 悬浮球控制 ---
          var ballSection = document.createElement('div'); ballSection.className = 'section';
          var bs = state.ballVisible ? '<span class="status status-on">\u663e\u793a\u4e2d</span>' : '<span class="status status-off">\u9690\u85cf</span>';
          ballSection.innerHTML = '<div class="section-title">\u60ac\u6d6e\u7403 ' + bs + '</div>' +
            '<button class="btn btn-primary" id="fb-toggle-ball">' + (state.ballVisible ? '\u9690\u85cf\u60ac\u6d6e\u7403' : '\u663e\u793a\u60ac\u6d6e\u7403') + '</button>';
          root.appendChild(ballSection);
          ballSection.querySelector('#fb-toggle-ball').onclick = function() {
            if (state.ballVisible) removeBall(); else ensureBall();
            render();
          };

          // --- 消息注入 ---
          var dis = state.conversationId ? '' : ' disabled';
          var msgSection = document.createElement('div'); msgSection.className = 'section';
          msgSection.innerHTML = '<div class="section-title">\u6d88\u606f\u6ce8\u5165</div>' +
            '<label>\u6d88\u606f\u5185\u5bb9</label>' +
            '<textarea id="fb-msg-text" placeholder="\u8f93\u5165\u8981\u6ce8\u5165\u7684\u6d88\u606f..."></textarea>' +
            '<button class="btn btn-primary" id="fb-inject-user"' + dis + '>\u6ce8\u5165\u7528\u6237\u6d88\u606f</button>' +
            '<button class="btn btn-secondary" id="fb-inject-char"' + dis + '>\u6ce8\u5165\u89d2\u8272\u6d88\u606f</button>' +
            '<button class="btn btn-orange" id="fb-inject-system"' + dis + '>\u6ce8\u5165\u7cfb\u7edf\u6d88\u606f</button>' +
            '<div class="divider"></div>' +
            '<label>\u7cfb\u7edf\u6d88\u606f\u7c7b\u578b</label>' +
            '<select id="fb-sys-kind">' +
              '<option value="info">info - \u4fe1\u606f</option>' +
              '<option value="friend_request">friend_request - \u597d\u53cb\u8bf7\u6c42</option>' +
              '<option value="group_created">group_created - \u7fa4\u7ec4\u521b\u5efa</option>' +
              '<option value="call">call - \u7535\u8bdd</option>' +
            '</select>';
          root.appendChild(msgSection);

          msgSection.querySelector('#fb-inject-user').onclick = function() {
            var text = msgSection.querySelector('#fb-msg-text').value.trim();
            if (!text || !state.conversationId) return;
            injectUserMessage(state.conversationId, text).then(function() { roche.ui.toast('\u7528\u6237\u6d88\u606f\u5df2\u6ce8\u5165'); msgSection.querySelector('#fb-msg-text').value = ''; });
          };
          msgSection.querySelector('#fb-inject-char').onclick = function() {
            var text = msgSection.querySelector('#fb-msg-text').value.trim();
            if (!text || !state.conversationId || !state.selectedChar) return;
            injectCharMessage(state.conversationId, text, state.selectedChar.handle || state.selectedChar.name, state.selectedCharId).then(function() { roche.ui.toast('\u89d2\u8272\u6d88\u606f\u5df2\u6ce8\u5165'); msgSection.querySelector('#fb-msg-text').value = ''; });
          };
          msgSection.querySelector('#fb-inject-system').onclick = function() {
            var text = msgSection.querySelector('#fb-msg-text').value.trim();
            var kind = msgSection.querySelector('#fb-sys-kind').value;
            if (!text || !state.conversationId) return;
            injectSystemNotice(state.conversationId, text, kind).then(function() { roche.ui.toast('\u7cfb\u7edf\u6d88\u606f\u5df2\u6ce8\u5165'); msgSection.querySelector('#fb-msg-text').value = ''; });
          };

          // --- AI原生回复 ---
          var aiSection = document.createElement('div'); aiSection.className = 'section';
          aiSection.innerHTML = '<div class="section-title">\u89e6\u53d1AI\u539f\u751f\u56de\u590d</div>' +
            '<p style="font-size:12px;color:var(--text2);margin:0 0 10px 0;">\u8f93\u5165\u6d88\u606f\u540e\u70b9\u51fb\uff0c\u4f1a\u81ea\u52a8\u8df3\u8f6c\u5230\u4f1a\u8bdd\u5e76\u53d1\u9001\uff0c\u8d70Roche\u5b8c\u6574\u6d41\u7a0b\uff08persona+\u8bb0\u5fc6+\u4e16\u754c\u4e66\uff09</p>' +
            '<textarea id="fb-ai-input" placeholder="\u8f93\u5165\u8981\u53d1\u9001\u7684\u6d88\u606f..."></textarea>' +
            '<button class="btn btn-green" id="fb-ai-native"' + dis + '>\u53d1\u9001\u5e76\u89e6\u53d1AI\u56de\u590d</button>' +
            '<div id="fb-ai-status" style="margin-top:8px;font-size:13px;"></div>';
          root.appendChild(aiSection);

          aiSection.querySelector('#fb-ai-native').onclick = function() {
            var text = aiSection.querySelector('#fb-ai-input').value.trim();
            if (!text || !state.conversationId) return;
            var statusEl = aiSection.querySelector('#fb-ai-status');
            statusEl.textContent = '\u6b63\u5728\u8df3\u8f6c\u5e76\u53d1\u9001...';
            triggerNativeReply(state.conversationId, text).then(function() {
              statusEl.textContent = '\u2705 \u5df2\u53d1\u9001\uff0c\u8bf7\u5728\u804a\u5929\u754c\u9762\u67e5\u770bAI\u56de\u590d';
              aiSection.querySelector('#fb-ai-input').value = '';
            }).catch(function(err) {
              statusEl.textContent = '\u274c ' + err.message;
            });
          };

          // --- 跳转 ---
          var navSection = document.createElement('div'); navSection.className = 'section';
          navSection.innerHTML = '<div class="section-title">\u5bfc\u822a</div>' +
            '<button class="btn btn-secondary" id="fb-jump"' + dis + '>\u8df3\u8f6c\u5230\u4f1a\u8bdd</button>';
          root.appendChild(navSection);
          navSection.querySelector('#fb-jump').onclick = function() {
            if (state.conversationId) navigateToConversation(state.conversationId);
          };

          // --- 记忆操作 ---
          var memSection = document.createElement('div'); memSection.className = 'section';
          memSection.innerHTML = '<div class="section-title">\u8bb0\u5fc6\u64cd\u4f5c</div>' +
            '<textarea id="fb-mem-text" placeholder="\u8f93\u5165\u8981\u5199\u5165\u7684\u4e8b\u5b9e\u8bb0\u5fc6..."></textarea>' +
            '<button class="btn btn-primary" id="fb-mem-write"' + dis + '>\u5199\u5165\u4e8b\u5b9e\u8bb0\u5fc6</button>' +
            '<button class="btn btn-secondary" id="fb-mem-read"' + dis + '>\u8bfb\u53d6\u957f\u671f\u8bb0\u5fc6</button>' +
            '<div id="fb-mem-result" style="margin-top:8px;font-size:13px;white-space:pre-wrap;"></div>';
          root.appendChild(memSection);
          memSection.querySelector('#fb-mem-write').onclick = function() {
            var text = memSection.querySelector('#fb-mem-text').value.trim();
            if (!text || !state.conversationId) return;
            roche.memory.write({ conversationId: state.conversationId, summaryText: text, who: ['\u7528\u6237'], action: text, when: '\u521a\u521a', where: '\u60ac\u6d6e\u7403\u63d2\u4ef6', source: 'floating-ball' })
            .then(function() { roche.ui.toast('\u4e8b\u5b9e\u8bb0\u5fc6\u5df2\u5199\u5165'); memSection.querySelector('#fb-mem-text').value = ''; });
          };
          memSection.querySelector('#fb-mem-read').onclick = function() {
            if (!state.conversationId) return;
            memSection.querySelector('#fb-mem-result').textContent = '\u8bfb\u53d6\u4e2d...';
            roche.memory.getLongTerm({ conversationId: state.conversationId, limit: 20 }).then(function(lt) {
              var lines = [];
              if (lt.core && lt.core.summary) lines.push('[\u6838\u5fc3] ' + lt.core.summary);
              (lt.facts || []).forEach(function(f) { lines.push('[\u4e8b\u5b9e] ' + (f.summaryText || f.action || f.text || '')); });
              memSection.querySelector('#fb-mem-result').textContent = lines.length > 0 ? lines.join('\n') : '(\u65e0\u8bb0\u5fc6)';
            });
          };
        }

        // ========== 初始化 ==========
        roche.storage.get('selectedCharId').then(function(sid) {
          if (sid) {
            state.selectedCharId = sid;
            return roche.character.get(sid).then(function(c) {
              state.selectedChar = c; state.conversationId = c.conversationId;
            }).catch(function() {});
          }
        }).then(function() {
          render();
          if (state.ballVisible) ensureBall();
        });
      },

      async unmount(container, roche) {
        // 关键：不删除悬浮球！只清理插件设置页面的DOM
        container.replaceChildren();
      }
    }
  ]
});
