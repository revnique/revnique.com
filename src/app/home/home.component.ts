import { Component, OnInit } from '@angular/core';
import { RevProject, RevService } from '../services/rev.service';
import { map } from 'rxjs/operators';
import { EMPTY, from, Observable, of } from 'rxjs';

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss'],
    standalone: false
})

export class HomeComponent implements OnInit {

  projects$: Observable<any> = EMPTY;
  isLocalhost: boolean = location.hostname === 'localhost';
  constructor(private svc: RevService) { }

  ngOnInit() {
    this.projects$ = from(this.svc.fetchPortfolioProjects());
    this.projects$.subscribe(projects => {
      for (const proj of projects) {
        if (proj.projectUrl.includes('react.revnique') && this.isLocalhost) {
          proj.projectUrl = 'http://localhost:5173/';
        }
      }
    });
  }
}

