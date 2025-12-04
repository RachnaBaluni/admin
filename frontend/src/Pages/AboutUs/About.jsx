import React from "react";
import styles from "./About.module.css"; // Main styles for the About page
// If you don't have a shared Header, you can inline the JSX for it directly here.

// Sub-component for the Table (Key Personnel)
const KeyPersonnelTable = () => (
  <div className={styles.tableContainer}>
    <div className={styles.tableWrapper}>
      <table className={styles.personnelTable}>
        <thead>
          <tr className={styles.tableHeaderRow}>
            <th className={`${styles.tableHeader} ${styles.colName}`}>Name</th>
            <th className={`${styles.tableHeader} ${styles.colPosition}`}>
              Position
            </th>
            <th className={`${styles.tableHeader} ${styles.colContact}`}>
              Contact
            </th>
          </tr>
        </thead>
        <tbody>
          <tr className={styles.tableRow}>
            <td className={`${styles.tableCell} ${styles.colName}`}>
              Ashok Kumar
            </td>
            <td className={`${styles.tableCell} ${styles.colPosition}`}>
              President
            </td>
            <td className={`${styles.tableCell} ${styles.colContact}`}>
              ashokkumar@bccinfra.com
            </td>
          </tr>
          <tr className={styles.tableRow}>
            <td className={`${styles.tableCell} ${styles.colName}`}>
              Sumit Goel
            </td>
            <td className={`${styles.tableCell} ${styles.colPosition}`}>
              Secretary
            </td>
            <td className={`${styles.tableCell} ${styles.colContact}`}>
              goelsumit3@rediffmail.com
            </td>
          </tr>
          <tr className={styles.tableRow}>
            <td className={`${styles.tableCell} ${styles.colName}`}>
              Dinesh Nagpal
            </td>
            <td className={`${styles.tableCell} ${styles.colPosition}`}>
              Treasurer
            </td>
            <td className={`${styles.tableCell} ${styles.colContact}`}>
              dineshnagpal@yahoo.com
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    {/* The @container specific styles will be in the CSS module */}
  </div>
);

const About = () => {
  return (
    <div className={styles.rootContainer}>
      <div className={styles.mainContentWrapper}>
        <div className={styles.contentContainer}>
          {/* About Us Section */}
          <div className={styles.aboutSection}>
            <div className={styles.aboutTextGroup}>
              <p className={styles.aboutHeading}>About Us</p>
              <p className={styles.aboutParagraph}>
                The Uttaranchal Tennis Association (UTA) is the governing body
                for tennis in the state of Uttarakhand, India. Established in
                2001, the association is committed to promoting and developing
                tennis at all levels, from grassroots to professional. UTA
                organizes tournaments, training programs, and workshops to
                enhance the skills of players and coaches. It also works to
                increase participation in tennis across the state, ensuring that
                the sport is accessible to everyone.
              </p>
            </div>
          </div>

          {/* Our Mission Section */}
          <h2 className={styles.sectionHeading}>Our Mission</h2>
          <p className={styles.sectionParagraph}>
            To foster a thriving tennis community in Uttarakhand by providing
            opportunities for players of all ages and abilities to participate,
            compete, and excel. We aim to promote the sport's values of
            sportsmanship, discipline, and teamwork, while also contributing to
            the overall health and well-being of our community.
          </p>

          {/* History Section */}
          <h2 className={styles.sectionHeading}>History</h2>
          <p className={styles.sectionParagraph}>
            Founded in 2001, the Uttaraanchal Tennis Association has a rich
            history of promoting tennis in the region. Over the years, UTA has
            organized numerous state-level and national tournaments, providing a
            platform for local talent to showcase their skills. The association
            has also been instrumental in developing infrastructure for tennis,
            including courts and training facilities. UTA's efforts have led to
            increased participation in tennis and the emergence of talented
            players from Uttarakhand.
          </p>

          {/* Key Personnel Section */}
          <h2 className={styles.sectionHeading}>Key Personnel</h2>
          <KeyPersonnelTable />

          <div className={styles.imageGridContainer}>
            <div className={styles.imageGrid}>
              <div
                className={styles.gridImageLarge}
                style={{
                  backgroundImage: 'url("/man2.png")',
                }}
              ></div>
              <div
                className={styles.gridImageSmall1}
                style={{
                  backgroundImage: 'url("/amn.png")',
                }}
              ></div>
              <div
                className={styles.gridImageSmall2}
                style={{
                  backgroundImage: 'url("/group.png")',
                }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
