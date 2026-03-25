const fs = require('fs');
const pagePath = 'src/app/miikiisgm/admin/page.tsx';
const newFormContent = fs.readFileSync('form_temp.txt', 'utf8');

let pageContent = fs.readFileSync(pagePath, 'utf8');
const startTag = '<form onSubmit={handleAdd}';
const endTag = '</form>';

const startIndex = pageContent.indexOf(startTag);
const endIndex = pageContent.indexOf(endTag, startIndex);

if (startIndex !== -1 && endIndex !== -1) {
    const beforeStr = pageContent.substring(0, startIndex);
    const afterStr = pageContent.substring(endIndex + endTag.length);
    pageContent = beforeStr + newFormContent + afterStr;
    fs.writeFileSync(pagePath, pageContent, 'utf8');
    console.log('Successfully replaced form content.');
} else {
    console.error('Could not find form boundaries!');
}
