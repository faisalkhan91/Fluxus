import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

interface Hobby {
  icon: string;
  name: string;
}

@Component({
  selector: 'app-interests',
  templateUrl: './interests.component.html',
  styleUrls: ['./interests.component.css'],
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InterestsComponent {
  hobbies = signal<Hobby[]>([
    { icon: 'fa-pencil-square', name: 'Drawing' },
    { icon: 'fa-cutlery', name: 'Cooking' },
    { icon: 'fa-music', name: 'Singing' },
    { icon: 'fa-book', name: 'Reading' }
  ]);
}
