import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { IconComponent } from '../icon/icon.component';

export interface EditorTab {
  id: string;
  label: string;
  ext: string;
  color: string;
  route: string;
}

@Component({
  selector: 'ui-editor-tab-bar',
  templateUrl: './editor-tab-bar.component.html',
  styleUrl: './editor-tab-bar.component.css',
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'role': 'tablist',
    'aria-label': 'Open pages',
  },
})
export class EditorTabBarComponent {
  tabs = input<EditorTab[]>([]);
  activeTabId = input<string>('');
  tabSelected = output<EditorTab>();
  tabClosed = output<EditorTab>();
}
