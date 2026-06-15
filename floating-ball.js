/**
 * Roche 悬浮球插件 v1.0.0
 * 功能：悬浮球快速操作 - 与char对话、注入消息、跳转会话
 * 基于 RocheToolkit 逆向的 IndexedDB 结构
 */

window.RochePlugin.register({
  id: "floating-ball",
  name: "悬浮球",
  version: "1.0.0",
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
            font-size: 14px; cursor: pointer; margin-right: 8px; margin-bottom: 8px;
          }
          .roche-plugin-floating-ball .btn-primary { background: var(--accent); color: #fff; }
          .roche-plugin-floating-ball .btn-secondary { background: var(--blue); color: #fff; }
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
          .fb-ball {
            position: fixed; width: 48px; height: 48px; border-radius: 50%;
            background: #e94560; color: #fff; display: flex; align-items: center; justify-content: center;
            font-size: 20px; cursor: pointer; z-index: 99999;
            box-shadow: 0 2px 12px rgba(233,69,96,0.4); user-select: none; transition: transform 0.2s;
          }
          .fb-ball:hover { transform: scale(1.1); }
          .fb-chat-panel {
            position: fixed; width: 300px; max-height: 400px; background: #141420;
            border-radius: 12px; box-shadow: 0 4px 24px rgba(0,0,0,0.6); z-index: 99998;
            display: flex; flex-direction: column; overflow: hidden;
          }
          .fb-chat-header { padding: 10px 14px; background: #1a1a2e; display: flex; align-items: center; justify-content: space-between; }
          .fb-chat-body { flex: 1; overflow-y: auto; padding: 10px; max-height: 280px; }
          .fb-chat-footer { padding: 8px; display: flex; gap: 6px; background: #1a1a2e; }
          .fb-chat-footer input { flex: 1; margin: 0; }
          .fb-bubble { padding: 8px 12px; border-radius: 12px; margin-bottom: 6px; font-size: 13px; max-width: 85%; word-break: break-word; }
          .fb-bubble-char { background: #16213e; }
          .fb-bubble-user { background: #0f3460; margin-left: auto; }
        `;
        document.head.appendChild(style);

        var state = { selectedCharId: null, selectedChar: null, conversationId: null, ballVisible: false, chatMessages: [], db: null };
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

        container.innerHTML = '<div class="roche-plugin-floating-ball"></div>';
        var root = container.querySelector('.roche-plugin-floating-ball');

        function render() {
          root.innerHTML = '';
          var h2 = document.createElement('h2'); h2.textContent = '悬浮球'; root.appendChild(h2);

          var charSection = document.createElement('div'); charSection.className = 'section';
          charSection.innerHTML = '<div class="section-title">选择角色</div><div id="fb-char-list">加载中...</div>';
          root.appendChild(charSection);
          roche.character.list().then(function(chars) {
            var listEl = charSection.querySelector('#fb-char-list');
            if (!chars || chars.length === 0) { listEl.textContent = '暂无角色'; return; }
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

          var ballSection = document.createElement('div'); ballSection.className = 'section';
          var bs = state.ballVisible ? '<span class="status status-on">显示中</span>' : '<span class="status status-off">隐藏</span>';
          ballSection.innerHTML = '<div class="section-title">悬浮球 ' + bs + '</div><button class="btn btn-primary" id="fb-toggle-ball">' + (state.ballVisible ? '隐藏悬浮球' : '显示悬浮球') + '</button>';
          root.appendChild(ballSection);
          ballSection.querySelector('#fb-toggle-ball').onclick = function() {
            state.ballVisible = !state.ballVisible;
            if (state.ballVisible) showFloatingBall(); else hideFloatingBall(); render();
          };

          var actionSection = document.createElement('div'); actionSection.className = 'section';
          var dis = state.conversationId ? '' : ' disabled';
          actionSection.innerHTML = '<div class="section-title">快速操作</div><label>消息内容</label>' +
            '<textarea id="fb-msg-text" placeholder="输入要注入的消息..."></textarea>' +
            '<button class="btn btn-primary" id="fb-inject-user"' + dis + '>注入用户消息</button>' +
            '<button class="btn btn-secondary" id="fb-inject-char"' + dis + '>注入角色消息</button>' +
            '<button class="btn btn-secondary" id="fb-auto-send"' + dis + '>DOM自动发送</button>' +
            '<button class="btn btn-secondary" id="fb-jump"' + dis + '>跳转到会话</button>';
          root.appendChild(actionSection);

          actionSection.querySelector('#fb-inject-user').onclick = function() {
            var text = actionSection.querySelector('#fb-msg-text').value.trim();
            if (!text || !state.conversationId) return;
            injectUserMessage(state.conversationId, text).then(function() { roche.ui.toast('用户消息已注入'); actionSection.querySelector('#fb-msg-text').value = ''; });
          };
          actionSection.querySelector('#fb-inject-char').onclick = function() {
            var text = actionSection.querySelector('#fb-msg-text').value.trim();
            if (!text || !state.conversationId || !state.selectedChar) return;
            injectCharMessage(state.conversationId, text, state.selectedChar.handle || state.selectedChar.name, state.selectedCharId).then(function() { roche.ui.toast('角色消息已注入'); actionSection.querySelector('#fb-msg-text').value = ''; });
          };
          actionSection.querySelector('#fb-auto-send').onclick = function() {
            var text = actionSection.querySelector('#fb-msg-text').value.trim();
            if (!text) return;
            if (state.conversationId) roche.ui.openApp(state.conversationId);
            setTimeout(function() { autoTypeAndSend(text); }, 1000);
          };
          actionSection.querySelector('#fb-jump').onclick = function() { if (state.conversationId) roche.ui.openApp(state.conversationId); };

          var aiSection = document.createElement('div'); aiSection.className = 'section';
          aiSection.innerHTML = '<div class="section-title">AI对话</div><textarea id="fb-ai-input" placeholder="输入消息让char回复..."></textarea>' +
            '<button class="btn btn-primary" id="fb-ai-chat"' + (state.selectedChar ? '' : ' disabled') + '>与char对话</button>' +
            '<div id="fb-ai-result" style="margin-top:8px;font-size:13px;"></div>';
          root.appendChild(aiSection);
          aiSection.querySelector('#fb-ai-chat').onclick = function() {
            var text = aiSection.querySelector('#fb-ai-input').value.trim();
            if (!text || !state.selectedChar) return;
            aiSection.querySelector('#fb-ai-result').textContent = '思考中...';
            roche.ai.chat({ messages: [{ role: 'system', content: state.selectedChar.persona || state.selectedChar.bio || '' }, { role: 'user', content: text }] })
            .then(function(r) { aiSection.querySelector('#fb-ai-result').textContent = r.text || '(无回复)'; })
            .catch(function(e) { aiSection.querySelector('#fb-ai-result').textContent = '错误: ' + (e.message || e); });
          };

          var memSection = document.createElement('div'); memSection.className = 'section';
          memSection.innerHTML = '<div class="section-title">记忆操作</div><textarea id="fb-mem-text" placeholder="输入要写入的事实记忆..."></textarea>' +
            '<button class="btn btn-primary" id="fb-mem-write"' + dis + '>写入事实记忆</button>' +
            '<button class="btn btn-secondary" id="fb-mem-read"' + dis + '>读取长期记忆</button>' +
            '<div id="fb-mem-result" style="margin-top:8px;font-size:13px;white-space:pre-wrap;"></div>';
          root.appendChild(memSection);
          memSection.querySelector('#fb-mem-write').onclick = function() {
            var text = memSection.querySelector('#fb-mem-text').value.trim();
            if (!text || !state.conversationId) return;
            roche.memory.write({ conversationId: state.conversationId, summaryText: text, who: ['用户'], action: text, when: '刚刚', where: '悬浮球插件', source: 'floating-ball' })
            .then(function() { roche.ui.toast('事实记忆已写入'); memSection.querySelector('#fb-mem-text').value = ''; });
          };
          memSection.querySelector('#fb-mem-read').onclick = function() {
            if (!state.conversationId) return;
            memSection.querySelector('#fb-mem-result').textContent = '读取中...';
            roche.memory.getLongTerm({ conversationId: state.conversationId, limit: 20 }).then(function(lt) {
              var lines = [];
              if (lt.core && lt.core.summary) lines.push('[核心] ' + lt.core.summary);
              (lt.facts || []).forEach(function(f) { lines.push('[事实] ' + (f.summaryText || f.action || f.text || '')); });
              memSection.querySelector('#fb-mem-result').textContent = lines.length > 0 ? lines.join('\n') : '(无记忆)';
            });
          };
        }

        var floatingBall = null, chatPanel = null;

        function showFloatingBall() {
          if (floatingBall) return;
          floatingBall = document.createElement('div'); floatingBall.className = 'fb-ball'; floatingBall.textContent = '💬';
          var ballX = window.innerWidth - 70, ballY = window.innerHeight / 2;
          floatingBall.style.left = ballX + 'px'; floatingBall.style.top = ballY + 'px';
          var isDragging = false, startX, startY, startLeft, startTop;
          function onDown(x, y) { isDragging = false; startX = x; startY = y; startLeft = ballX; startTop = ballY; }
          function onMove(x, y) { var dx = x - startX, dy = y - startY; if (Math.abs(dx) > 5 || Math.abs(dy) > 5) isDragging = true; ballX = startLeft + dx; ballY = startTop + dy; floatingBall.style.left = ballX + 'px'; floatingBall.style.top = ballY + 'px'; }
          function onUp() { if (ballX < window.innerWidth / 2) ballX = 10; else ballX = window.innerWidth - 58; floatingBall.style.left = ballX + 'px'; if (!isDragging) toggleChatPanel(); }
          floatingBall.addEventListener('mousedown', function(e) { onDown(e.clientX, e.clientY); function m(e2) { onMove(e2.clientX, e2.clientY); } function u() { document.removeEventListener('mousemove', m); document.removeEventListener('mouseup', u); onUp(); } document.addEventListener('mousemove', m); document.addEventListener('mouseup', u); });
          floatingBall.addEventListener('touchstart', function(e) { var t = e.touches[0]; onDown(t.clientX, t.clientY); function m(e2) { var t2 = e2.touches[0]; onMove(t2.clientX, t2.clientY); } function u() { document.removeEventListener('touchmove', m); document.removeEventListener('touchend', u); onUp(); } document.addEventListener('touchmove', m); document.addEventListener('touchend', u); });
          document.body.appendChild(floatingBall);
        }

        function hideFloatingBall() { if (floatingBall) { floatingBall.remove(); floatingBall = null; } hideChatPanel(); }
        function toggleChatPanel() { if (chatPanel) hideChatPanel(); else showChatPanel(); }

        function showChatPanel() {
          if (chatPanel || !state.selectedChar) return;
          chatPanel = document.createElement('div'); chatPanel.className = 'fb-chat-panel'; chatPanel.style.right = '10px'; chatPanel.style.bottom = '70px';
          var cn = state.selectedChar.handle || state.selectedChar.name || 'Char';
          chatPanel.innerHTML = '<div class="fb-chat-header"><span style="font-size:14px;font-weight:bold;">' + cn + '</span><span style="cursor:pointer;font-size:18px;" id="fb-chat-close">\u2715</span></div><div class="fb-chat-body" id="fb-chat-body"></div><div class="fb-chat-footer"><input type="text" id="fb-chat-input" placeholder="\u8bf4\u70b9\u4ec0\u4e48..."><button class="btn btn-primary" id="fb-chat-send" style="margin:0;padding:6px 12px;">\u53d1\u9001</button></div>';
          document.body.appendChild(chatPanel);
          chatPanel.querySelector('#fb-chat-close').onclick = hideChatPanel;
          chatPanel.querySelector('#fb-chat-send').onclick = sendChatMessage;
          chatPanel.querySelector('#fb-chat-input').onkeydown = function(e) { if (e.key === 'Enter') sendChatMessage(); };
          renderChatMessages();
        }

        function hideChatPanel() { if (chatPanel) { chatPanel.remove(); chatPanel = null; } }

        function renderChatMessages() {
          var body = document.getElementById('fb-chat-body'); if (!body) return; body.innerHTML = '';
          state.chatMessages.forEach(function(m) { var b = document.createElement('div'); b.className = 'fb-bubble ' + (m.isMe ? 'fb-bubble-user' : 'fb-bubble-char'); b.textContent = m.text; body.appendChild(b); });
          body.scrollTop = body.scrollHeight;
        }

        function sendChatMessage() {
          var input = document.getElementById('fb-chat-input'); if (!input) return;
          var text = input.value.trim(); if (!text || !state.conversationId || !state.selectedChar) return;
          state.chatMessages.push({ isMe: true, text: text }); renderChatMessages(); input.value = '';
          var persona = state.selectedChar.persona || state.selectedChar.bio || '';
          var ctx = state.chatMessages.slice(-10).map(function(m) { return { role: m.isMe ? 'user' : 'assistant', content: m.text }; });
          roche.ai.chat({ messages: [{ role: 'system', content: persona }].concat(ctx) })
          .then(function(r) { state.chatMessages.push({ isMe: false, text: r.text || '...' }); renderChatMessages(); })
          .catch(function(e) { state.chatMessages.push({ isMe: false, text: '[\u9519\u8bef] ' + (e.message || e) }); renderChatMessages(); });
        }

        function autoTypeAndSend(text) {
          try {
            var input = document.querySelector('.chat-input-textarea') || document.querySelector('[contenteditable="true"]') || document.querySelector('textarea');
            if (!input) { roche.ui.toast('\u627e\u4e0d\u5230\u8f93\u5165\u6846'); return; }
            input.focus();
            if (input.tagName === 'TEXTAREA' || input.type === 'text') {
              var setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value');
              if (setter) setter.call(input, text);
              input.dispatchEvent(new Event('input', { bubbles: true })); input.dispatchEvent(new Event('change', { bubbles: true }));
            } else { input.innerText = text; input.dispatchEvent(new Event('input', { bubbles: true })); }
            setTimeout(function() {
              var sendBtn = document.querySelector('.chat-input-send') || document.querySelector('.chat-input-send-icon') || document.querySelector('button[class*="send"]');
              if (sendBtn) sendBtn.click();
              else input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true }));
              roche.ui.toast('\u6d88\u606f\u5df2\u53d1\u9001');
            }, 300);
          } catch(e) { roche.ui.toast('\u53d1\u9001\u5931\u8d25: ' + e.message); }
        }

        roche.storage.get('selectedCharId').then(function(sid) {
          if (sid) { state.selectedCharId = sid; return roche.character.get(sid).then(function(c) { state.selectedChar = c; state.conversationId = c.conversationId; }).catch(function() {}); }
        }).then(function() { render(); });

        container._fbState = state;
      },

      async unmount(container, roche) {
        document.querySelectorAll('.fb-ball').forEach(function(b) { b.remove(); });
        document.querySelectorAll('.fb-chat-panel').forEach(function(p) { p.remove(); });
        var style = document.getElementById('roche-plugin-floating-ball-style'); if (style) style.remove();
        container.replaceChildren();
      }
    }
  ]
});