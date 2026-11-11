import os
import glob
from bs4 import BeautifulSoup, NavigableString, Comment

def element_to_pug(element, indent_level=0):
    indent = '  ' * indent_level
    pug_str = ""

    # Handle HTML Comments
    if isinstance(element, Comment):
        return f"{indent}// {element.strip()}\n"
    
    # Handle pure text nodes
    if isinstance(element, NavigableString):
        text = str(element).strip()
        if text:
            # Pug uses the pipe character for plain text lines
            return f"{indent}| {text}\n"
        return ""

    tag_name = element.name
    if not tag_name:
        return ""

    classes = element.get('class', [])
    id_attr = element.get('id')

    # Build the Pug selector (e.g., div#app.container)
    selector = tag_name
    
    # In Pug, 'div' is the default tag, so div#app can just be #app
    if tag_name == 'div' and (classes or id_attr):
        selector = ""
        
    if id_attr:
        selector += f"#{id_attr}"
    if classes:
        if isinstance(classes, list):
            selector += "." + ".".join(classes)
        else:
            selector += f".{classes}"

    # Build remaining attributes (href, src, data-*, etc.)
    attrs = []
    for key, value in element.attrs.items():
        if key not in ['class', 'id']:
            if isinstance(value, list):
                value = " ".join(value)
            attrs.append(f'{key}="{value}"')
    
    attr_str = f"({', '.join(attrs)})" if attrs else ""

    # Add the current element line
    pug_str += f"{indent}{selector}{attr_str}\n"

    # Recursively process children and increase indentation
    for child in element.children:
        pug_str += element_to_pug(child, indent_level + 1)

    return pug_str

def batch_convert_html_to_pug(folder_path):
    html_files = glob.glob(os.path.join(folder_path, '*.html'))
    
    if not html_files:
        print("No HTML files found.")
        return
        
    for file_path in html_files:
        with open(file_path, 'r', encoding='utf-8') as f:
            soup = BeautifulSoup(f.read(), 'html.parser')
            
        pug_content = ""
        for child in soup.children:
            pug_content += element_to_pug(child, 0)
            
        out_path = os.path.splitext(file_path)[0] + '.pug'
        with open(out_path, 'w', encoding='utf-8') as f:
            f.write(pug_content)
            
        print(f"Converted: {os.path.basename(file_path)}")

# Replace with your target folder path
batch_convert_html_to_pug('.')
