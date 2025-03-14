import { Injectable, Component } from '@angular/core';
import { Observable, catchError, of, throwError } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { HttpClient, HttpHeaders, HttpParams, HttpResponse } from '@angular/common/http';
// @ts-ignore
import config from '../../aws-export';
Amplify.configure(config as any);
import { Amplify } from 'aws-amplify';
import { generateClient } from "aws-amplify/api";


@Injectable()
export class RevService {
    urlRoot: string = location.href.indexOf('localhost:') > -1 ? 'http://localhost:47777/' : 'https://bucktrace.com/';
    svcRoot: string = location.href.indexOf('localhost:') > -1 ? 'http://localhost:57777/api/' : 'https://api.bucktrace.com/';
    private client: any;
    constructor(private http: HttpClient) {
        this.client = generateClient();
    }
    baseUrl = 'https://api.revnique.works';

    getProjects(): Observable<RevProject[]> {
        let url = `${this.baseUrl}/item`;
        let headers = new HttpHeaders({ 'content-type': 'application/json' });

        return this.http
            .get<Observable<any>>(url, {
                headers: headers,
                observe: 'response'
            })
            .pipe(tap(resp => console.log(resp)), map(this.map), catchError(this.catch));
    };

    private map(response: HttpResponse<any>): Observable<any> {
        return response.statusText === 'No Content' ? of('') : response.body.success || {};
    }

    private catch(error: any, url?: any, obj?: any): Observable<any> {
        console.log(error);
        if (url || obj) console.error('Server Exception: ', url, obj);
        return throwError(() => { error || 'Server Error' });
    }


  fetchPortfolioProjects = async () => {
    console.log('fetchPortfolioProjects svc');
    const response: any = await this.client.graphql({
      query: `
          query listPortfolioProjects {
            listPortfolioProjects {
              items {
                id
                cdt
                name
                comment
                image
                projectUrl
                techList
              }
            }
          }
        `,
    });
    let tmp = response.data.listPortfolioProjects.items;
    tmp.sort((a: any, b: any) => a.id - b.id);
    return tmp;
  }
}



export class RevProject {
    public name: string = '';
    public image: string = '';
    public comment: string = '';
    public projectUrl: string = '';
    public techList: string[] = [];
}

