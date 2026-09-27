import '~/assets/app.css';
import { render } from 'preact';
import { WelcomePage } from './WelcomePage';
import { applyDocumentLocale } from '~/shared/document-locale';

applyDocumentLocale('welcomeTitle');

render(<WelcomePage />, document.getElementById('app')!);
