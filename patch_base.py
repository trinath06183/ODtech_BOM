import re

with open(r'd:\ODtech\Main_work\odtech_BOM\templates\base.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace ntpFetch to support FormData
new_ntpfetch = """    async function ntpFetch(url, method='GET', body=null) {
        const isFormData = body instanceof FormData;
        const opts = {
            method,
            headers: { 'X-CSRFToken': getCsrfToken() },
        };
        if (!isFormData) {
            opts.headers['Content-Type'] = 'application/json';
        }
        if (body) {
            opts.body = isFormData ? body : JSON.stringify(body);
        }
        const r = await fetch(url, opts);
        return r.json();
    }
"""
content = re.sub(r'async function ntpFetch.*?return r\.json\(\);\s*\}', new_ntpfetch, content, flags=re.DOTALL)

# Add helper for viewing document
doc_render_helper = """    function renderDocumentItem(d) {
        const ext = d.url.split('.').pop().toLowerCase();
        const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);
        const isPdf = ['pdf'].includes(ext);
        const target = (isImage || isPdf) ? 'target="_blank"' : '';
        return `
            <div style="display:flex;align-items:center;justify-content:space-between;padding:6px 8px;background:#f3f4f6;border-radius:6px;margin-top:4px;font-size:0.75rem;">
                <div style="display:flex;align-items:center;gap:6px;overflow:hidden;">
                    <span style="font-size:1.1rem;">📎</span>
                    <div style="display:flex;flex-direction:column;min-width:0;">
                        <a href="${d.url}" ${target} style="color:#4f46e5;text-decoration:none;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="${d.name}">
                            ${d.name}
                        </a>
                        ${d.reference_text ? `<span style="color:#6b7280;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escHtml(d.reference_text)}</span>` : ''}
                    </div>
                </div>
                <button type="button" onclick="ntpDeleteDocument('${d.id}')" style="background:none;border:none;cursor:pointer;color:#ef4444;padding:2px;flex-shrink:0;">
                    <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                </button>
            </div>
        `;
    }
    
    async function ntpDeleteDocument(id) {
        if (!confirm('Delete this reference document?')) return;
        const data = await ntpFetch(`/api/reference-document/${id}/delete/`, 'DELETE');
        if (data.success) {
            ntpLoadNotes();
            ntpLoadTodos();
        }
    }
"""

content = content.replace('function ntpRenderNotes() {', doc_render_helper + '\n    function ntpRenderNotes() {')

# Render documents in note
note_render = """<!-- Expandable content -->
                <div id="note-expand-${n.id}" style="display:none;margin-top:10px;font-size:.84rem;color:#374151;
                    background:#f9fafb;border-radius:8px;padding:10px 12px;white-space:pre-wrap;word-break:break-word;max-height:200px;overflow-y:auto;">
                    ${escHtml(n.content || '(no content)')}
                    ${n.documents && n.documents.length ? `<div style="margin-top:8px;border-top:1px solid #e5e7eb;padding-top:8px;">${n.documents.map(renderDocumentItem).join('')}</div>` : ''}
                </div>"""
content = re.sub(r'<!-- Expandable content -->.*?</div>\s*</div>\s*`\)', note_render + '\n            </div>\n        `).join(\'\')', content, flags=re.DOTALL)

# Add file input to note modal
note_modal_fields = """<textarea id="ntp-modal-content" rows="8" placeholder="Write your note here…"
                style="width:100%;border:1px solid #d1d5db;border-radius:8px;padding:9px 12px;font-size:.85rem;resize:vertical;box-sizing:border-box;outline:none;font-family:inherit;"></textarea>
            
            <div style="margin-top:10px;background:#f9fafb;padding:10px;border-radius:8px;border:1px dashed #d1d5db;">
                <label style="font-size:0.8rem;font-weight:600;color:#374151;display:block;margin-bottom:6px;">Attach Reference Documents</label>
                <input id="ntp-modal-docs" type="file" multiple style="font-size:0.8rem;width:100%;margin-bottom:8px;">
                <input id="ntp-modal-doc-ref" type="text" placeholder="Document Reference (applies to all attached files)" style="width:100%;border:1px solid #d1d5db;border-radius:6px;padding:6px 9px;font-size:0.8rem;box-sizing:border-box;outline:none;">
            </div>"""
content = re.sub(r'<textarea id="ntp-modal-content".*?</textarea>', note_modal_fields, content, flags=re.DOTALL)

# Save Note function
save_note_js = """async function ntpSaveNote() {
        const title   = document.getElementById('ntp-modal-title').value.trim();
        const content = document.getElementById('ntp-modal-content').value;
        const files = document.getElementById('ntp-modal-docs').files;
        const docRef = document.getElementById('ntp-modal-doc-ref').value;
        
        if (!title) { alert('Title is required.'); return; }

        const btn = document.getElementById('ntp-modal-save-btn');
        btn.textContent = 'Saving…'; btn.disabled = true;

        const formData = new FormData();
        formData.append('title', title);
        formData.append('content', content);
        for(let i=0; i<files.length; i++) {
            formData.append('documents', files[i]);
            formData.append('document_references', docRef);
        }

        let data;
        if (NTP.editingNoteId) {
            // PATCH doesn't accept multipart in Django by default, so we send POST which the backend accepts
            data = await ntpFetch(`/api/my/notes/${NTP.editingNoteId}/`, 'POST', formData);
            if (data.success) {
                const idx = NTP.notes.findIndex(n => n.id === NTP.editingNoteId);
                if (idx >= 0) NTP.notes[idx] = data.note;
            }
        } else {
            data = await ntpFetch('/api/my/notes/', 'POST', formData);
            if (data.success) NTP.notes.unshift(data.note);
        }

        btn.textContent = 'Save'; btn.disabled = false;
        if (data.success) {
            closeNoteModal();
            ntpRenderNotes();
        } else {
            alert(data.error || 'Failed to save note.');
        }
    }"""
content = re.sub(r'async function ntpSaveNote.*?alert\(data\.error.*?\n\s*\}', save_note_js, content, flags=re.DOTALL)

# Reset file inputs on note modal open
content = content.replace("document.getElementById('ntp-modal-content').value = '';", "document.getElementById('ntp-modal-content').value = '';\n        document.getElementById('ntp-modal-docs').value = '';\n        document.getElementById('ntp-modal-doc-ref').value = '';")
content = content.replace("document.getElementById('ntp-modal-content').value = note.content || '';", "document.getElementById('ntp-modal-content').value = note.content || '';\n        document.getElementById('ntp-modal-docs').value = '';\n        document.getElementById('ntp-modal-doc-ref').value = '';")


# Todo render 
todo_render = """<div id="todo-view-${t.id}" style="">
                        <span style="font-size:.87rem;font-weight:600;color:#1f2937;${ t.is_completed ? 'text-decoration:line-through;color:#9ca3af;' : '' }">${escHtml(t.title)}</span>
                        ${t.description ? `<div style="font-size:.78rem;color:#6b7280;margin-top:2px;word-break:break-word;white-space:pre-wrap;">${escHtml(t.description)}</div>` : ''}
                        ${t.documents && t.documents.length ? `<div style="margin-top:6px;">${t.documents.map(renderDocumentItem).join('')}</div>` : ''}
                        ${t.updated_at ? `<div style="font-size:.72rem;color:#9ca3af;margin-top:3px;">✏️ Edited: ${t.updated_at}</div>` : ''}
                    </div>"""
content = re.sub(r'<div id="todo-view-\$\{t\.id\}".*?✏️ Edited.*?</div>\s*</div>', todo_render, content, flags=re.DOTALL)

# Todo Edit form
todo_edit = """<div id="todo-edit-${t.id}" style="display:none;padding:8px 16px;background:#f9fafb;border-bottom:1px solid #e5e7eb;">
                <input id="todo-edit-title-${t.id}" type="text" value="${escAttr(t.title)}"
                    style="width:100%;border:1px solid #d1d5db;border-radius:6px;padding:6px 9px;font-size:.82rem;margin-bottom:6px;box-sizing:border-box;outline:none;">
                <textarea id="todo-edit-desc-${t.id}" rows="2" placeholder="Description (optional)"
                    style="width:100%;border:1px solid #d1d5db;border-radius:6px;padding:6px 9px;font-size:.8rem;resize:vertical;box-sizing:border-box;outline:none;font-family:inherit;">${escHtml(t.description)}</textarea>
                
                <div style="margin-top:6px;margin-bottom:6px;">
                    <input id="todo-edit-docs-${t.id}" type="file" multiple style="font-size:0.75rem;width:100%;margin-bottom:4px;">
                    <input id="todo-edit-doc-ref-${t.id}" type="text" placeholder="Document Reference" style="width:100%;border:1px solid #d1d5db;border-radius:6px;padding:4px 6px;font-size:0.75rem;box-sizing:border-box;outline:none;">
                </div>

                <div style="display:flex;gap:8px;justify-content:flex-end;">
                    <button onclick="cancelTodoEdit('${t.id}')" style="padding:5px 14px;border:1px solid #d1d5db;border-radius:6px;background:#fff;font-size:.8rem;cursor:pointer;">Cancel</button>
                    <button onclick="ntpSaveTodoEdit('${t.id}')" style="padding:5px 14px;border:none;border-radius:6px;background:#059669;color:#fff;font-size:.8rem;font-weight:600;cursor:pointer;">Save</button>
                </div>
            </div>"""
content = re.sub(r'<div id="todo-edit-\$\{t\.id\}".*?Save</button>\s*</div>\s*</div>', todo_edit, content, flags=re.DOTALL)

# Todo toggle API
content = content.replace("ntpFetch(`/api/my/todos/${id}/`, 'PATCH', { is_completed: checked });", "ntpFetch(`/api/my/todos/${id}/`, 'POST', (() => { const fd = new FormData(); fd.append('is_completed', checked); return fd; })());")

# Todo create API
todo_create = """async function ntpCreateTodo() {
        const input = document.getElementById('ntp-todo-title-input');
        const title = input.value.trim();
        if (!title) { input.focus(); return; }
        const fd = new FormData();
        fd.append('title', title);
        const data = await ntpFetch('/api/my/todos/', 'POST', fd);
        if (data.success) {
            NTP.todos.unshift(data.todo);
            ntpRenderTodos();
            input.value = '';
        } else {
            alert(data.error || 'Failed to create task.');
        }
    }"""
content = re.sub(r'async function ntpCreateTodo\(\).*?\}\s*\}', todo_create, content, flags=re.DOTALL)


# Todo edit save API
todo_save = """async function ntpSaveTodoEdit(id) {
        const title = document.getElementById('todo-edit-title-' + id).value.trim();
        const desc  = document.getElementById('todo-edit-desc-'  + id).value;
        const files = document.getElementById('todo-edit-docs-' + id).files;
        const docRef = document.getElementById('todo-edit-doc-ref-' + id).value;

        if (!title) { alert('Title cannot be empty.'); return; }
        
        const fd = new FormData();
        fd.append('title', title);
        fd.append('description', desc);
        for(let i=0; i<files.length; i++) {
            fd.append('documents', files[i]);
            fd.append('document_references', docRef);
        }

        const data = await ntpFetch(`/api/my/todos/${id}/`, 'POST', fd);
        if (data.success) {
            const idx = NTP.todos.findIndex(t => t.id === id);
            if (idx >= 0) NTP.todos[idx] = data.todo;
            ntpRenderTodos();
        } else {
            alert(data.error || 'Failed to save.');
        }
    }"""
content = re.sub(r'async function ntpSaveTodoEdit\(id\).*?\}\s*\}', todo_save, content, flags=re.DOTALL)


with open(r'd:\ODtech\Main_work\odtech_BOM\templates\base.html', 'w', encoding='utf-8') as f:
    f.write(content)
