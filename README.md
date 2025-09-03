# Angular Catalyst

An interactive Angular application that helps employees discover new opportunities within their company to develop skills and advance their careers.

## Features

- **Smart Matching Algorithm**: Matches employees with opportunities based on skills, performance, interests, and career goals
- **Interactive Profile Builder**: Angular reactive forms to capture employee information
- **Comprehensive Opportunity Database**: Sample opportunities across different departments
- **Detailed Match Analysis**: Shows why opportunities match and identifies skill gaps
- **Modern UI**: Built with Angular 17, Angular Material, and TypeScript

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
ng serve
```

3. Open [http://localhost:4200](http://localhost:4200) in your browser

## How It Works

1. **Employee Profile**: Fill out your profile including:
   - Basic information (name, department, role)
   - Skills and experience level
   - Performance rating
   - Areas of interest
   - Career goals
   - Availability preferences

2. **Smart Matching**: The algorithm calculates match scores based on:
   - Skill alignment (40% of score)
   - Interest alignment (20% of score)
   - Performance rating (15% of score)
   - Experience level matching (10% of score)
   - Career goals alignment (10% of score)
   - Cross-departmental bonus (5% of score)

3. **Browse Opportunities**: View matched opportunities with:
   - Match percentage and reasons
   - Required and preferred skills
   - Learning outcomes
   - Time commitment and duration
   - Skill gaps to address

4. **Apply**: Submit applications directly through the interface

## Technology Stack

- **Frontend**: Angular 17, TypeScript
- **UI Components**: Angular Material
- **Forms**: Angular Reactive Forms
- **Routing**: Angular Router
- **State Management**: Angular Services with RxJS
- **Styling**: SCSS with Angular Material theming

## Project Structure

```
src/
├── app/
│   ├── components/
│   │   ├── employee-form/
│   │   ├── match-results/
│   │   └── opportunity-card/
│   ├── models/
│   │   └── employee.model.ts
│   ├── services/
│   │   ├── employee.service.ts
│   │   ├── matching.service.ts
│   │   └── opportunity.service.ts
│   ├── app.component.ts
│   ├── app.config.ts
│   └── app.routes.ts
├── styles.scss
└── index.html
```

## Key Angular Features Used

- **Standalone Components**: Modern Angular architecture
- **Reactive Forms**: Type-safe form handling
- **Angular Material**: Consistent UI components
- **RxJS**: Reactive programming for data flow
- **Angular Router**: Client-side routing
- **Dependency Injection**: Service-based architecture

## Customization

- **Add Opportunities**: Edit `opportunity.service.ts` to add more opportunities
- **Modify Matching Logic**: Update `matching.service.ts` to adjust the algorithm
- **Styling**: Customize Angular Material theme in `styles.scss`

## Future Enhancements

- Backend API integration
- User authentication with Angular Guards
- State management with NgRx
- Unit testing with Jasmine/Karma
- E2E testing with Protractor/Cypress
- Progressive Web App (PWA) features
