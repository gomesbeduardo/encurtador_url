import { DataTypes, Model } from 'sequelize';
     import sequelize from '../config/database';

     class Url extends Model {
       public id!: number;
       public originalUrl!: string;
       public shortCode!: string;
       public createdAt!: Date;
     }

     Url.init(
       {
         originalUrl: {
           type: DataTypes.STRING,
           allowNull: false,
         },
         shortCode: {
           type: DataTypes.STRING,
           allowNull: false,
           unique: true,
         },
       },
       {
         sequelize,
         modelName: 'Url',
         tableName: 'urls',
       }
     );

     export default Url;