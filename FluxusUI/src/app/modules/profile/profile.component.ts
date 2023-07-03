import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  currentToggle: string = 'overview';

  constructor() { }

  ngOnInit(): void {
  }

  profileToggleFunction(toggleVal: string) {
    this.currentToggle = toggleVal;
    }
}
