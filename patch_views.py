import re

with open(r'd:\ODtech\Main_work\odtech_BOM\tracker\views.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace api_notes_list_create
new_api_notes_list_create = """@login_required
def api_notes_list_create(request):
    \"\"\"GET → list user's notes; POST → create a note.\"\"\"
    if request.method == 'GET':
        notes = UserNote.objects.filter(user=request.user).prefetch_related('documents')
        data = []
        for n in notes:
            docs = [{'id': str(d.id), 'url': d.document.url, 'name': d.document.name.split('/')[-1], 'reference_text': d.reference_text} for d in n.documents.all()]
            data.append({
                'id': str(n.id),
                'title': n.title,
                'content': n.content,
                'updated_at': n.updated_at.strftime('%Y-%m-%d %H:%M'),
                'documents': docs,
            })
        return JsonResponse({'notes': data})

    # POST
    is_multipart = request.content_type.startswith('multipart/form-data')
    if is_multipart:
        title = request.POST.get('title', '').strip()
        content = request.POST.get('content', '').strip()
        files = request.FILES.getlist('documents')
        doc_refs = request.POST.getlist('document_references')
    else:
        try:
            body = json.loads(request.body)
        except Exception:
            return JsonResponse({'success': False, 'error': 'Invalid JSON.'}, status=400)
        title = body.get('title', '').strip()
        content = body.get('content', '').strip()
        files = []
        doc_refs = []

    if not title:
        return JsonResponse({'success': False, 'error': 'Title is required.'}, status=400)

    note = UserNote.objects.create(
        user=request.user,
        title=title,
        content=content,
    )

    docs_data = []
    for i, f in enumerate(files):
        ref = doc_refs[i] if i < len(doc_refs) else ''
        doc = UserReferenceDocument.objects.create(user=request.user, note=note, document=f, reference_text=ref)
        docs_data.append({'id': str(doc.id), 'url': doc.document.url, 'name': doc.document.name.split('/')[-1], 'reference_text': doc.reference_text})

    return JsonResponse({
        'success': True,
        'note': {
            'id': str(note.id),
            'title': note.title,
            'content': note.content,
            'updated_at': note.updated_at.strftime('%Y-%m-%d %H:%M'),
            'documents': docs_data,
        }
    })"""

# Replace api_note_detail
new_api_note_detail = """@login_required
def api_note_detail(request, note_id):
    \"\"\"POST/PUT/PATCH → update; DELETE → delete. User can only touch their own notes.\"\"\"
    note = get_object_or_404(UserNote, id=note_id, user=request.user)

    if request.method == 'DELETE':
        note.delete()
        return JsonResponse({'success': True})

    if request.method in ('PUT', 'PATCH', 'POST'):
        is_multipart = request.content_type.startswith('multipart/form-data')
        if is_multipart:
            # Django only parses POST data for multipart, so we need to use request.POST
            title = request.POST.get('title', note.title).strip()
            content = request.POST.get('content', note.content)
            files = request.FILES.getlist('documents')
            doc_refs = request.POST.getlist('document_references')
        else:
            try:
                body = json.loads(request.body)
            except Exception:
                return JsonResponse({'success': False, 'error': 'Invalid JSON.'}, status=400)
            title = body.get('title', note.title).strip() or note.title
            content = body.get('content', note.content)
            files = []
            doc_refs = []

        note.title = title or note.title
        note.content = content
        note.save()

        for i, f in enumerate(files):
            ref = doc_refs[i] if i < len(doc_refs) else ''
            UserReferenceDocument.objects.create(user=request.user, note=note, document=f, reference_text=ref)

        docs_data = [{'id': str(d.id), 'url': d.document.url, 'name': d.document.name.split('/')[-1], 'reference_text': d.reference_text} for d in note.documents.all()]

        return JsonResponse({
            'success': True,
            'note': {
                'id': str(note.id),
                'title': note.title,
                'content': note.content,
                'updated_at': note.updated_at.strftime('%Y-%m-%d %H:%M'),
                'documents': docs_data,
            }
        })

    return JsonResponse({'success': False, 'error': 'Method not allowed.'}, status=405)"""

# Replace api_todos_list_create
new_api_todos_list_create = """@login_required
def api_todos_list_create(request):
    \"\"\"GET → list user's todos; POST → create a todo.\"\"\"
    if request.method == 'GET':
        todos = UserTodo.objects.filter(user=request.user).prefetch_related('documents')
        data = []
        for t in todos:
            docs = [{'id': str(d.id), 'url': d.document.url, 'name': d.document.name.split('/')[-1], 'reference_text': d.reference_text} for d in t.documents.all()]
            data.append({
                'id': str(t.id),
                'title': t.title,
                'description': t.description,
                'is_completed': t.is_completed,
                'updated_at': t.updated_at.strftime('%Y-%m-%d %H:%M'),
                'documents': docs,
            })
        return JsonResponse({'todos': data})

    # POST
    is_multipart = request.content_type.startswith('multipart/form-data')
    if is_multipart:
        title = request.POST.get('title', '').strip()
        description = request.POST.get('description', '').strip()
        files = request.FILES.getlist('documents')
        doc_refs = request.POST.getlist('document_references')
    else:
        try:
            body = json.loads(request.body)
        except Exception:
            return JsonResponse({'success': False, 'error': 'Invalid JSON.'}, status=400)
        title = body.get('title', '').strip()
        description = body.get('description', '').strip()
        files = []
        doc_refs = []

    if not title:
        return JsonResponse({'success': False, 'error': 'Title is required.'}, status=400)

    todo = UserTodo.objects.create(
        user=request.user,
        title=title,
        description=description,
    )

    docs_data = []
    for i, f in enumerate(files):
        ref = doc_refs[i] if i < len(doc_refs) else ''
        doc = UserReferenceDocument.objects.create(user=request.user, todo=todo, document=f, reference_text=ref)
        docs_data.append({'id': str(doc.id), 'url': doc.document.url, 'name': doc.document.name.split('/')[-1], 'reference_text': doc.reference_text})

    return JsonResponse({
        'success': True,
        'todo': {
            'id': str(todo.id),
            'title': todo.title,
            'description': todo.description,
            'is_completed': todo.is_completed,
            'updated_at': todo.updated_at.strftime('%Y-%m-%d %H:%M'),
            'documents': docs_data,
        }
    })"""

# Replace api_todo_detail
new_api_todo_detail = """@login_required
def api_todo_detail(request, todo_id):
    \"\"\"POST/PUT/PATCH → toggle or update; DELETE → delete. User can only touch their own todos.\"\"\"
    todo = get_object_or_404(UserTodo, id=todo_id, user=request.user)

    if request.method == 'DELETE':
        todo.delete()
        return JsonResponse({'success': True})

    if request.method in ('PUT', 'PATCH', 'POST'):
        is_multipart = request.content_type.startswith('multipart/form-data')
        if is_multipart:
            if 'is_completed' in request.POST:
                todo.is_completed = request.POST.get('is_completed') in ['true', '1', 'True']
            if 'title' in request.POST:
                todo.title = request.POST.get('title').strip() or todo.title
            if 'description' in request.POST:
                todo.description = request.POST.get('description')
            files = request.FILES.getlist('documents')
            doc_refs = request.POST.getlist('document_references')
        else:
            try:
                body = json.loads(request.body)
            except Exception:
                return JsonResponse({'success': False, 'error': 'Invalid JSON.'}, status=400)

            if 'is_completed' in body:
                todo.is_completed = bool(body['is_completed'])
            if 'title' in body:
                todo.title = body['title'].strip() or todo.title
            if 'description' in body:
                todo.description = body['description']
            files = []
            doc_refs = []

        todo.save()

        for i, f in enumerate(files):
            ref = doc_refs[i] if i < len(doc_refs) else ''
            UserReferenceDocument.objects.create(user=request.user, todo=todo, document=f, reference_text=ref)

        docs_data = [{'id': str(d.id), 'url': d.document.url, 'name': d.document.name.split('/')[-1], 'reference_text': d.reference_text} for d in todo.documents.all()]

        return JsonResponse({ 
            'success': True,
            'todo': {
                'id': str(todo.id),
                'title': todo.title,
                'description': todo.description,
                'is_completed': todo.is_completed,
                'updated_at': todo.updated_at.strftime('%Y-%m-%d %H:%M'),
                'documents': docs_data,
            }
        })

    return JsonResponse({'success': False, 'error': 'Method not allowed.'}, status=405)

@login_required
def api_delete_reference_document(request, doc_id):
    doc = get_object_or_404(UserReferenceDocument, id=doc_id, user=request.user)
    if request.method == 'DELETE':
        doc.delete()
        return JsonResponse({'success': True})
    return JsonResponse({'success': False, 'error': 'Method not allowed.'}, status=405)
"""

content = re.sub(r'@login_required\s*\n\s*def api_notes_list_create.*?return JsonResponse.*?\}\)\n', new_api_notes_list_create + '\n\n', content, flags=re.DOTALL)
content = re.sub(r'@login_required\s*\n\s*def api_note_detail.*?return JsonResponse.*?\}\)\n\n\s*return JsonResponse\(\{\'success\': False.*?\}\)', new_api_note_detail, content, flags=re.DOTALL)
content = re.sub(r'@login_required\s*\n\s*def api_todos_list_create.*?return JsonResponse.*?\}\)\n', new_api_todos_list_create + '\n\n', content, flags=re.DOTALL)
content = re.sub(r'@login_required\s*\n\s*def api_todo_detail.*?return JsonResponse.*?\}\)\n\n\s*return JsonResponse\(\{\'success\': False.*?\}\)', new_api_todo_detail, content, flags=re.DOTALL)

# Also import UserReferenceDocument
content = content.replace('from .models import UserNote, UserTodo\n', 'from .models import UserNote, UserTodo, UserReferenceDocument\n')

with open(r'd:\ODtech\Main_work\odtech_BOM\tracker\views.py', 'w', encoding='utf-8') as f:
    f.write(content)
