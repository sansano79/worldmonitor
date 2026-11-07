import './style.css';
import { mountCsm } from './shell';

const root = document.getElementById('app');
if (!root) throw new Error('CSM root is missing');
mountCsm(root);
