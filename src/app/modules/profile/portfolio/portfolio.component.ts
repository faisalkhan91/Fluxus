import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-portfolio',
  templateUrl: './portfolio.component.html',
  styleUrls: ['./portfolio.component.css'],
  imports: [NgOptimizedImage],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PortfolioComponent {

}
