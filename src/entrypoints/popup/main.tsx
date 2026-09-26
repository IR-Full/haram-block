import '~/assets/app.css';
import { render } from 'preact';
import { Popup } from './Popup';
import { applyDocumentLocale } from '~/shared/document-locale';

applyDocumentLocale('extName');

render(<Popup />, document.getElementById('app')!);
